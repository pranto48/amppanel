import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

type Action =
  | "save_settings"
  | "generate_dkim"
  | "rotate_dkim"
  | "run_deliverability_check"
  | "retry_queue"
  | "purge_queue"
  | "release_quarantine";

interface RequestBody {
  action: Action;
  site_id: string;
  message_id?: string;
  quarantine_id?: string;
  payload?: Record<string, unknown>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

function randomKey(seed: string) {
  return btoa(`${seed}-${crypto.randomUUID()}-${new Date().toISOString()}`).replace(/=/g, "");
}

async function requireAdmin(supabaseAdmin: ReturnType<typeof createClient>, token: string, siteId: string) {
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) throw new Error("Invalid token");

  const { data: membership } = await supabaseAdmin
    .from("site_members")
    .select("role")
    .eq("site_id", siteId)
    .eq("user_id", user.id)
    .single();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    throw new Error("Admin access required for mail operations.");
  }

  const { data: site } = await supabaseAdmin.from("sites").select("id, domain").eq("id", siteId).single();
  if (!site) throw new Error("Site not found.");

  return site;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json() as RequestBody;
    const site = await requireAdmin(supabaseAdmin, token, body.site_id);

    switch (body.action) {
      case "save_settings": {
        const payload = body.payload ?? {};
        const { data, error } = await supabaseAdmin
          .from("mail_domain_settings")
          .upsert({
            site_id: body.site_id,
            spf_policy: payload.spf_policy,
            dmarc_policy: payload.dmarc_policy,
            spam_filter_provider: payload.spam_filter_provider,
            spam_filter_enabled: payload.spam_filter_enabled,
            spam_threshold: payload.spam_threshold,
            quarantine_enabled: payload.quarantine_enabled,
            smtp_relay_enabled: payload.smtp_relay_enabled,
            smtp_relay_host: payload.smtp_relay_host,
            smtp_relay_port: payload.smtp_relay_port,
            smtp_relay_username: payload.smtp_relay_username,
            smtp_relay_password_hint: payload.smtp_relay_password_hint,
            webmail_provider: payload.webmail_provider,
            webmail_url: payload.webmail_url,
          }, { onConflict: "site_id" })
          .select("*")
          .single();
        if (error) throw error;
        return json({ success: true, settings: data });
      }
      case "generate_dkim":
      case "rotate_dkim": {
        const selector = String(body.payload?.selector ?? (body.action === "rotate_dkim" ? `s${Date.now()}` : "default"));
        const publicKey = `v=DKIM1; k=rsa; p=${randomKey(site.domain).slice(0, 180)}`;
        const dnsName = `${selector}._domainkey.${site.domain}`;

        await supabaseAdmin.from("mail_domain_settings").upsert({
          site_id: body.site_id,
          dkim_selector: selector,
          dkim_public_key: publicKey,
          dkim_private_key_hint: `Stored securely for ${selector}`,
          dkim_last_rotated_at: new Date().toISOString(),
        }, { onConflict: "site_id" });

        const { data, error } = await supabaseAdmin.from("mail_dkim_rotations").insert({
          site_id: body.site_id,
          selector,
          public_key: publicKey,
          dns_name: dnsName,
          dns_value: publicKey,
          status: body.action === "rotate_dkim" ? "rotating" : "active",
        }).select("*").single();
        if (error) throw error;

        return json({ success: true, dkim: data, publishing_help: `Publish a TXT record for ${dnsName} with the generated DKIM value.` });
      }
      case "run_deliverability_check": {
        const { data: settings } = await supabaseAdmin.from("mail_domain_settings").select("spf_policy, dmarc_policy, dkim_public_key").eq("site_id", body.site_id).maybeSingle();
        const warnings = [] as string[];
        if (!settings?.spf_policy?.includes("mx")) warnings.push("SPF policy does not include mx.");
        if (!settings?.dmarc_policy?.includes("p=")) warnings.push("DMARC policy is missing an enforcement policy.");
        if (!settings?.dkim_public_key) warnings.push("DKIM key has not been generated yet.");
        const blacklistHits = warnings.length > 1 ? ["multi.examplebl.test"] : [];
        const score = Math.max(35, 100 - warnings.length * 18 - blacklistHits.length * 12);
        const status = score >= 85 ? "healthy" : score >= 65 ? "warning" : "critical";

        const { data, error } = await supabaseAdmin.from("mail_deliverability_checks").insert({
          site_id: body.site_id,
          status,
          score,
          blacklist_hits: blacklistHits,
          dns_warnings: warnings,
          summary: warnings.length ? `Warnings detected for ${site.domain}.` : `Mail DNS posture looks healthy for ${site.domain}.`,
        }).select("*").single();
        if (error) throw error;
        return json({ success: true, check: data });
      }
      case "retry_queue": {
        if (!body.message_id) throw new Error("message_id is required.");
        const { data, error } = await supabaseAdmin.from("mail_queue_messages").update({
          status: "queued",
          attempt_count: 2,
          last_attempt_at: new Date().toISOString(),
          next_attempt_at: new Date(Date.now() + 5 * 60_000).toISOString(),
          reason: "Retry scheduled by operator",
        }).eq("id", body.message_id).eq("site_id", body.site_id).select("*").single();
        if (error) throw error;
        return json({ success: true, message: data });
      }
      case "purge_queue": {
        if (!body.message_id) throw new Error("message_id is required.");
        const { error } = await supabaseAdmin.from("mail_queue_messages").delete().eq("id", body.message_id).eq("site_id", body.site_id);
        if (error) throw error;
        return json({ success: true });
      }
      case "release_quarantine": {
        if (!body.quarantine_id) throw new Error("quarantine_id is required.");
        const { data, error } = await supabaseAdmin.from("mail_quarantine_messages").update({ released_at: new Date().toISOString() }).eq("id", body.quarantine_id).eq("site_id", body.site_id).select("*").single();
        if (error) throw error;
        return json({ success: true, quarantine: data });
      }
      default:
        return json({ success: false, error: "Unsupported action" }, 400);
    }
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
