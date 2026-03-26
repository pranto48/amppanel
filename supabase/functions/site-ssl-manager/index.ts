import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

type SslAction = "issue" | "renew" | "revoke" | "diagnostics";
type ChallengeType = "http_01" | "dns_01";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface RequestBody {
  action: SslAction;
  site_id: string;
  config?: {
    challenge_type?: ChallengeType;
    is_wildcard?: boolean;
    dns_provider?: string | null;
    auto_redirect_http?: boolean;
    alert_before_days?: number;
    alternate_names?: string[];
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeDomain(domain: string) {
  return domain.toLowerCase().trim();
}

function buildDiagnostics(domain: string, challengeType: ChallengeType, isWildcard: boolean, expiresAt: string | null) {
  const expiry = expiresAt ? new Date(expiresAt) : null;
  const daysLeft = expiry ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000)) : null;
  return [
    `Chain issuer: Let's Encrypt R11`,
    `Primary domain: ${domain}`,
    `Challenge flow: ${challengeType === "dns_01" ? "DNS-01" : "HTTP-01"}`,
    isWildcard ? "Wildcard certificate enabled for DNS-01 validation." : "Single-domain certificate issuance path.",
    expiry ? `Expires in ${daysLeft} day(s) on ${expiry.toISOString()}.` : "Certificate has not been issued yet.",
    "OCSP staple check: simulated healthy.",
    "Certificate chain order: simulated valid.",
  ].join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json() as RequestBody;
    const { data: site, error: siteError } = await supabaseAdmin.from("sites").select("*").eq("id", body.site_id).single();
    if (siteError || !site) {
      return new Response(JSON.stringify({ success: false, error: "Site not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: membership } = await supabaseAdmin.from("site_members").select("role").eq("site_id", body.site_id).eq("user_id", user.id).single();
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return new Response(JSON.stringify({ success: false, error: "Admin access required for SSL management" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: existingCert } = await supabaseAdmin.from("site_ssl_certificates").select("*").eq("site_id", body.site_id).maybeSingle();
    const isWildcard = body.config?.is_wildcard ?? existingCert?.is_wildcard ?? false;
    const challengeType = (isWildcard ? "dns_01" : (body.config?.challenge_type ?? existingCert?.challenge_type ?? "http_01")) as ChallengeType;
    const autoRedirectHttp = body.config?.auto_redirect_http ?? existingCert?.auto_redirect_http ?? true;
    const alertBeforeDays = body.config?.alert_before_days ?? existingCert?.alert_before_days ?? 14;
    const alternateNames = body.config?.alternate_names ?? existingCert?.alternate_names ?? [];
    const dnsProvider = body.config?.dns_provider ?? existingCert?.dns_provider ?? null;
    const primaryDomain = normalizeDomain(isWildcard ? `*.${site.domain}` : site.domain);

    if (isWildcard && challengeType !== "dns_01") {
      return new Response(JSON.stringify({ success: false, error: "Wildcard certificates require DNS-01 validation." }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if ((body.action === "issue" || body.action === "renew") && challengeType === "dns_01" && !dnsProvider) {
      return new Response(JSON.stringify({ success: false, error: "DNS provider is required for DNS-01 validation." }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body.action === "revoke") {
      const revokedAt = new Date().toISOString();
      const diagnostics = buildDiagnostics(primaryDomain, challengeType, isWildcard, existingCert?.expires_at ?? null);
      const { data: certificate } = await supabaseAdmin
        .from("site_ssl_certificates")
        .upsert({
          site_id: body.site_id,
          provider: "lets_encrypt",
          challenge_type: challengeType,
          is_wildcard: isWildcard,
          primary_domain: primaryDomain,
          alternate_names: alternateNames,
          dns_provider: dnsProvider,
          auto_redirect_http: autoRedirectHttp,
          certificate_status: "revoked",
          revoked_at: revokedAt,
          certificate_chain_issuer: existingCert?.certificate_chain_issuer ?? "Let's Encrypt R11",
          certificate_chain_valid: false,
          certificate_chain_diagnostics: `${diagnostics}\nCertificate revoked at ${revokedAt}.`,
          last_error: null,
          alert_before_days: alertBeforeDays,
        }, { onConflict: "site_id" })
        .select("*")
        .single();

      await supabaseAdmin.from("sites").update({ ssl_enabled: false, ssl_expiry: null }).eq("id", body.site_id);
      return new Response(JSON.stringify({ success: true, certificate }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const issuedAt = body.action === "renew" ? existingCert?.issued_at ?? new Date().toISOString() : new Date().toISOString();
    const renewedAt = body.action === "renew" ? new Date().toISOString() : null;
    const expiresAt = new Date(Date.now() + 90 * 86400000).toISOString();
    const diagnostics = buildDiagnostics(primaryDomain, challengeType, isWildcard, expiresAt);
    const certificateStatus = alertBeforeDays >= 90 ? "expiring" : (body.action === "renew" ? "issued" : "issued");

    if (body.action === "diagnostics") {
      const diagnosticsText = buildDiagnostics(primaryDomain, challengeType, isWildcard, existingCert?.expires_at ?? null);
      const { data: certificate } = await supabaseAdmin
        .from("site_ssl_certificates")
        .upsert({
          site_id: body.site_id,
          provider: "lets_encrypt",
          challenge_type: challengeType,
          is_wildcard: isWildcard,
          primary_domain: primaryDomain,
          alternate_names: alternateNames,
          dns_provider: dnsProvider,
          auto_redirect_http: autoRedirectHttp,
          certificate_status: existingCert?.certificate_status ?? "pending",
          expires_at: existingCert?.expires_at ?? null,
          alert_before_days: alertBeforeDays,
          certificate_chain_issuer: existingCert?.certificate_chain_issuer ?? "Let's Encrypt R11",
          certificate_chain_valid: existingCert?.certificate_chain_valid ?? true,
          certificate_chain_diagnostics: diagnosticsText,
          last_error: null,
        }, { onConflict: "site_id" })
        .select("*")
        .single();

      return new Response(JSON.stringify({ success: true, certificate, diagnostics: diagnosticsText }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: certificate } = await supabaseAdmin
      .from("site_ssl_certificates")
      .upsert({
        site_id: body.site_id,
        provider: "lets_encrypt",
        challenge_type: challengeType,
        is_wildcard: isWildcard,
        primary_domain: primaryDomain,
        alternate_names: alternateNames,
        dns_provider: dnsProvider,
        auto_redirect_http: autoRedirectHttp,
        certificate_status: certificateStatus,
        issued_at: issuedAt,
        renewed_at: renewedAt,
        expires_at: expiresAt,
        alert_before_days: alertBeforeDays,
        certificate_chain_issuer: "Let's Encrypt R11",
        certificate_chain_valid: true,
        certificate_chain_diagnostics: diagnostics,
        last_error: null,
      }, { onConflict: "site_id" })
      .select("*")
      .single();

    await supabaseAdmin.from("sites").update({ ssl_enabled: true, ssl_expiry: expiresAt }).eq("id", body.site_id);

    return new Response(JSON.stringify({ success: true, certificate, diagnostics }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
