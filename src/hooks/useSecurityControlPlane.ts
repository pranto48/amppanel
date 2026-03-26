import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { TablesInsert } from "@/integrations/supabase/types";

export function useSecurityControlPlane(siteId?: string) {
  return useQuery({
    queryKey: ["security_control_plane", siteId ?? "all"],
    queryFn: async () => {
      const filter = <T extends { eq: (key: string, value: string) => T }>(query: T) => (siteId ? query.eq("site_id", siteId) : query);

      const [
        providersRes,
        rulesRes,
        wafPoliciesRes,
        wafEventsRes,
        sshKeysRes,
        scansRes,
        secretFindingsRes,
        geoAlertsRes,
        ipReputationRes,
        auditRes,
      ] = await Promise.all([
        filter(supabase.from("firewall_providers").select("*").order("updated_at", { ascending: false })),
        filter(supabase.from("firewall_rules_v2").select("*").order("priority", { ascending: true })),
        filter(supabase.from("waf_policies").select("*").order("updated_at", { ascending: false })),
        filter(supabase.from("waf_events").select("*").order("detected_at", { ascending: false }).limit(25)),
        filter(supabase.from("ssh_keys").select("*").order("created_at", { ascending: false })),
        filter(supabase.from("site_security_scans").select("*").order("scanned_at", { ascending: false }).limit(30)),
        filter(supabase.from("secret_scan_findings").select("*").order("detected_at", { ascending: false }).limit(40)),
        filter(supabase.from("login_geo_alerts").select("*").order("login_at", { ascending: false }).limit(40)),
        filter(supabase.from("ip_reputation_events").select("*").order("checked_at", { ascending: false }).limit(40)),
        filter(supabase.from("security_audit_events").select("*").order("created_at", { ascending: false }).limit(60)),
      ]);

      const responses = [providersRes, rulesRes, wafPoliciesRes, wafEventsRes, sshKeysRes, scansRes, secretFindingsRes, geoAlertsRes, ipReputationRes, auditRes];
      const firstError = responses.find((res) => res.error)?.error;
      if (firstError) throw firstError;

      return {
        firewallProviders: providersRes.data ?? [],
        firewallRules: rulesRes.data ?? [],
        wafPolicies: wafPoliciesRes.data ?? [],
        wafEvents: wafEventsRes.data ?? [],
        sshKeys: sshKeysRes.data ?? [],
        scans: scansRes.data ?? [],
        secretFindings: secretFindingsRes.data ?? [],
        geoAlerts: geoAlertsRes.data ?? [],
        reputationEvents: ipReputationRes.data ?? [],
        auditEvents: auditRes.data ?? [],
      };
    },
  });
}

const securityMutation = <T extends keyof {
  firewall_rules_v2: TablesInsert<"firewall_rules_v2">;
  waf_policies: TablesInsert<"waf_policies">;
  ssh_keys: TablesInsert<"ssh_keys">;
  site_security_scans: TablesInsert<"site_security_scans">;
  security_audit_events: TablesInsert<"security_audit_events">;
}>(table: T) => {
  return ({ siteId }: { siteId?: string }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
      mutationFn: async (payload: Omit<
        T extends "firewall_rules_v2" ? TablesInsert<"firewall_rules_v2"> :
        T extends "waf_policies" ? TablesInsert<"waf_policies"> :
        T extends "ssh_keys" ? TablesInsert<"ssh_keys"> :
        T extends "site_security_scans" ? TablesInsert<"site_security_scans"> :
        TablesInsert<"security_audit_events">,
        "site_id"
      >) => {
        const row = { ...payload, site_id: siteId ?? null };
        const { error } = await supabase.from(table).insert(row as never);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["security_control_plane"] });
        toast({ title: "Saved", description: "Security control-plane data updated." });
      },
      onError: (error: Error) => {
        toast({ variant: "destructive", title: "Error", description: error.message });
      },
    });
  };
};

export const useCreateFirewallRule = securityMutation("firewall_rules_v2");
export const useCreateWafPolicy = securityMutation("waf_policies");
export const useCreateSshKey = securityMutation("ssh_keys");
export const useRunSecurityScan = securityMutation("site_security_scans");
export const useAppendSecurityAuditEvent = securityMutation("security_audit_events");
