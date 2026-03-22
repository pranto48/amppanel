import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

type Action = "save_package" | "save_reseller" | "assign_package" | "suspend_site" | "unsuspend_site" | "run_usage_audit" | "resolve_alert";
interface RequestBody {
  action: Action;
  site_id?: string;
  package_id?: string;
  reseller_account_id?: string | null;
  alert_id?: string;
  payload?: Record<string, unknown>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ success: false, error: "Unauthorized" }, 401);

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return json({ success: false, error: "Invalid token" }, 401);

    const { data: roleRecord } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!roleRecord || !["admin", "super_admin"].includes(roleRecord.role)) {
      return json({ success: false, error: "Admin access required for hosting control plane." }, 403);
    }

    const body = await req.json() as RequestBody;

    switch (body.action) {
      case "save_package": {
        const payload = body.payload ?? {};
        const { data, error } = await supabaseAdmin.from("hosting_packages").upsert({
          id: payload.id,
          name: payload.name,
          description: payload.description,
          billing_cycle: payload.billing_cycle,
          price_usd: payload.price_usd,
          storage_limit_mb: payload.storage_limit_mb,
          bandwidth_limit_gb: payload.bandwidth_limit_gb,
          max_domains: payload.max_domains,
          max_subdomains: payload.max_subdomains,
          max_databases: payload.max_databases,
          max_mailboxes: payload.max_mailboxes,
          max_cron_jobs: payload.max_cron_jobs,
          supports_nodejs: payload.supports_nodejs,
          php_versions: payload.php_versions,
          features: payload.features ?? {},
          is_active: payload.is_active ?? true,
        }).select("*").single();
        if (error) throw error;
        return json({ success: true, package: data });
      }
      case "save_reseller": {
        const payload = body.payload ?? {};
        const { data, error } = await supabaseAdmin.from("reseller_accounts").upsert({
          id: payload.id,
          profile_id: payload.profile_id,
          company_name: payload.company_name,
          contact_email: payload.contact_email,
          max_client_accounts: payload.max_client_accounts,
          max_sites: payload.max_sites,
          commission_rate: payload.commission_rate,
          branding: payload.branding ?? {},
          is_active: payload.is_active ?? true,
        }).select("*").single();
        if (error) throw error;
        return json({ success: true, reseller: data });
      }
      case "assign_package": {
        if (!body.site_id || !body.package_id) throw new Error("site_id and package_id are required.");
        const { data: site, error: siteError } = await supabaseAdmin.from("sites").select("*").eq("id", body.site_id).single();
        if (siteError || !site) throw new Error("Site not found.");
        const { data: pkg, error: pkgError } = await supabaseAdmin.from("hosting_packages").select("*").eq("id", body.package_id).single();
        if (pkgError || !pkg) throw new Error("Package not found.");

        const { data, error } = await supabaseAdmin.from("site_hosting_assignments").upsert({
          site_id: body.site_id,
          package_id: body.package_id,
          reseller_account_id: body.reseller_account_id ?? null,
          assigned_by: user.id,
          assignment_status: site.status === "suspended" ? "suspended" : "active",
          notes: `Assigned ${pkg.name} package`,
        }, { onConflict: "site_id" }).select("*").single();
        if (error) throw error;
        await supabaseAdmin.from("sites").update({ storage_limit_mb: pkg.storage_limit_mb, bandwidth_limit_gb: pkg.bandwidth_limit_gb }).eq("id", body.site_id);
        return json({ success: true, assignment: data });
      }
      case "suspend_site":
      case "unsuspend_site": {
        if (!body.site_id) throw new Error("site_id is required.");
        const suspended = body.action === "suspend_site";
        const { data, error } = await supabaseAdmin.from("sites").update({ status: suspended ? "suspended" : "active" }).eq("id", body.site_id).select("*").single();
        if (error) throw error;
        await supabaseAdmin.from("site_hosting_assignments").update({ assignment_status: suspended ? "suspended" : "active" }).eq("site_id", body.site_id);
        return json({ success: true, site: data });
      }
      case "run_usage_audit": {
        const { data: sites, error } = await supabaseAdmin.from("sites").select("id, domain, storage_used_mb, storage_limit_mb, bandwidth_used_gb, bandwidth_limit_gb");
        if (error) throw error;
        const { data: assignments } = await supabaseAdmin.from("site_hosting_assignments").select("site_id, package_id");

        const alerts = [] as Record<string, unknown>[];
        for (const site of sites ?? []) {
          const assignment = assignments?.find((item) => item.site_id === site.id);
          if (site.storage_used_mb >= site.storage_limit_mb * 0.85) {
            alerts.push({ site_id: site.id, package_id: assignment?.package_id ?? null, alert_type: "storage", current_value: site.storage_used_mb, limit_value: site.storage_limit_mb, message: `${site.domain} storage is at ${site.storage_used_mb}/${site.storage_limit_mb} MB.` });
          }
          if (Number(site.bandwidth_used_gb) >= site.bandwidth_limit_gb * 0.85) {
            alerts.push({ site_id: site.id, package_id: assignment?.package_id ?? null, alert_type: "bandwidth", current_value: Number(site.bandwidth_used_gb), limit_value: site.bandwidth_limit_gb, message: `${site.domain} bandwidth is at ${site.bandwidth_used_gb}/${site.bandwidth_limit_gb} GB.` });
          }
        }
        if (alerts.length) await supabaseAdmin.from("resource_overuse_alerts").insert(alerts);
        return json({ success: true, alerts_created: alerts.length });
      }
      case "resolve_alert": {
        if (!body.alert_id) throw new Error("alert_id is required.");
        const { data, error } = await supabaseAdmin.from("resource_overuse_alerts").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", body.alert_id).select("*").single();
        if (error) throw error;
        return json({ success: true, alert: data });
      }
      default:
        return json({ success: false, error: "Unsupported action" }, 400);
    }
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
