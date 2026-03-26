import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SslChallengeType = "http_01" | "dns_01";
export type SslCertificateStatus = "pending" | "issued" | "renewing" | "revoked" | "failed" | "expiring";
export type SslAction = "issue" | "renew" | "revoke" | "diagnostics";

export interface SiteSslCertificate {
  id: string;
  site_id: string;
  provider: string;
  challenge_type: SslChallengeType;
  is_wildcard: boolean;
  primary_domain: string;
  alternate_names: string[];
  dns_provider: string | null;
  auto_redirect_http: boolean;
  certificate_status: SslCertificateStatus;
  issued_at: string | null;
  renewed_at: string | null;
  revoked_at: string | null;
  expires_at: string | null;
  alert_before_days: number;
  last_alert_sent_at: string | null;
  certificate_chain_issuer: string | null;
  certificate_chain_valid: boolean | null;
  certificate_chain_diagnostics: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteSslConfigInput {
  challenge_type?: SslChallengeType;
  is_wildcard?: boolean;
  dns_provider?: string | null;
  auto_redirect_http?: boolean;
  alert_before_days?: number;
  alternate_names?: string[];
}

export function useSiteSslCertificate(siteId: string) {
  return useQuery({
    queryKey: ["site-ssl-certificate", siteId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_ssl_certificates")
        .select("*")
        .eq("site_id", siteId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as SiteSslCertificate | null;
    },
    enabled: !!siteId,
  });
}

function createSslMutation(action: SslAction) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ siteId, config }: { siteId: string; config?: SiteSslConfigInput }) => {
      const { data, error } = await supabase.functions.invoke("site-ssl-manager", {
        body: { action, site_id: siteId, config },
      });
      if (error) throw error;
      return data as { success: boolean; certificate: SiteSslCertificate; diagnostics?: string };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["site-ssl-certificate", variables.siteId] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export function useIssueSiteSsl() {
  return createSslMutation("issue");
}

export function useRenewSiteSsl() {
  return createSslMutation("renew");
}

export function useRevokeSiteSsl() {
  return createSslMutation("revoke");
}

export function useSslDiagnostics() {
  return createSslMutation("diagnostics");
}
