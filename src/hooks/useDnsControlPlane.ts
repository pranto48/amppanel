import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DnsZoneStatus = "active" | "pending" | "paused" | "error";
export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA" | "PTR";
export type DnsRecordStatus = "active" | "pending" | "error";
export type DnsPropagationStatus = "pending" | "healthy" | "warning" | "failed";

export interface DnsZoneRecord {
  id: string;
  zone_id: string;
  template_id: string | null;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl: number;
  priority: number | null;
  weight: number | null;
  port: number | null;
  target: string | null;
  proxied: boolean;
  is_glue: boolean;
  status: DnsRecordStatus;
  last_validated_at: string | null;
  validation_error: string | null;
  updated_at: string;
}

export interface DnsZone {
  id: string;
  site_id: string | null;
  cluster_id: string | null;
  origin: string;
  status: DnsZoneStatus;
  zone_type: string;
  serial: number;
  refresh_seconds: number;
  retry_seconds: number;
  expire_seconds: number;
  minimum_ttl_seconds: number;
  default_ttl_seconds: number;
  primary_nameserver: string;
  admin_email: string;
  dnssec_enabled: boolean;
  transfer_acl: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sites?: { id: string; domain: string; status: string } | null;
  dns_clusters?: { id: string; name: string; provider: string; role: string; endpoint: string | null } | null;
  dns_records: DnsZoneRecord[];
  dns_secondary_nameservers: Array<{ id: string; hostname: string; ipv4: string | null; ipv6: string | null; transfer_enabled: boolean }>;
  dns_glue_records: Array<{ id: string; hostname: string; ipv4: string | null; ipv6: string | null }>;
  dns_propagation_checks: Array<{ id: string; resolver: string; status: DnsPropagationStatus; observed_value: string | null; expected_value: string | null; latency_ms: number | null; checked_at: string; details: string | null; record_id: string | null }>;
}

export interface DnsTemplate {
  id: string;
  site_id: string | null;
  name: string;
  description: string | null;
  scope: "system" | "site";
  is_enabled: boolean;
  records: Array<Record<string, unknown>>;
}

export interface DnsCluster {
  id: string;
  name: string;
  provider: string;
  role: string;
  location: string | null;
  endpoint: string | null;
  is_enabled: boolean;
}

export interface DnsRecordInput {
  id?: string;
  type: DnsRecordType;
  name: string;
  content: string;
  ttl: number;
  priority?: number | null;
  weight?: number | null;
  port?: number | null;
  target?: string | null;
  proxied?: boolean;
  is_glue?: boolean;
}

export function useDnsZones() {
  return useQuery({
    queryKey: ["dns-zones"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dns_zones")
        .select(`
          *,
          sites(id, domain, status),
          dns_clusters(id, name, provider, role, endpoint),
          dns_records(*),
          dns_secondary_nameservers(*),
          dns_glue_records(*),
          dns_propagation_checks(*)
        `)
        .order("origin", { ascending: true });

      if (error) throw error;
      return (data ?? []) as DnsZone[];
    },
  });
}

export function useDnsTemplates() {
  return useQuery({
    queryKey: ["dns-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dns_record_templates")
        .select("*")
        .eq("is_enabled", true)
        .order("scope", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DnsTemplate[];
    },
  });
}

export function useDnsClusters() {
  return useQuery({
    queryKey: ["dns-clusters"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("dns_clusters").select("*").order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DnsCluster[];
    },
  });
}

function createDnsMutation(action: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("dns-control-plane", {
        body: { action, ...body },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dns-zones"] });
      queryClient.invalidateQueries({ queryKey: ["dns-templates"] });
      queryClient.invalidateQueries({ queryKey: ["dns-clusters"] });
    },
  });
}

export function useCreateDnsZone() {
  return createDnsMutation("create_zone");
}

export function useSaveDnsRecord() {
  return createDnsMutation("save_record");
}

export function useDeleteDnsRecord() {
  return createDnsMutation("delete_record");
}

export function useSaveDnsGlue() {
  return createDnsMutation("save_glue");
}

export function useSaveDnsSecondary() {
  return createDnsMutation("save_secondary");
}

export function useRunDnsPropagationCheck() {
  return createDnsMutation("run_propagation_check");
}

export function useApplyDnsTemplate() {
  return createDnsMutation("apply_template");
}
