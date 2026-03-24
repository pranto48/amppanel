import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HostingPackage {
  id: string;
  name: string;
  description: string | null;
  billing_cycle: "monthly" | "quarterly" | "yearly";
  price_usd: number;
  storage_limit_mb: number;
  bandwidth_limit_gb: number;
  max_domains: number;
  max_subdomains: number;
  max_databases: number;
  max_mailboxes: number;
  max_cron_jobs: number;
  supports_nodejs: boolean;
  php_versions: string[];
  features: Record<string, unknown>;
  is_active: boolean;
}

export interface ResellerAccount {
  id: string;
  profile_id: string;
  company_name: string;
  contact_email: string;
  max_client_accounts: number;
  max_sites: number;
  commission_rate: number;
  is_active: boolean;
  profiles?: { id: string; email: string | null; full_name: string | null } | null;
}

export interface SiteHostingAssignment {
  id: string;
  site_id: string;
  package_id: string;
  reseller_account_id: string | null;
  assignment_status: string;
  notes: string | null;
  sites?: { id: string; domain: string; status: string; storage_used_mb: number; storage_limit_mb: number; bandwidth_used_gb: number; bandwidth_limit_gb: number } | null;
  hosting_packages?: HostingPackage | null;
  reseller_accounts?: { id: string; company_name: string } | null;
}

export interface ResourceOveruseAlert {
  id: string;
  site_id: string;
  package_id: string | null;
  alert_type: "storage" | "bandwidth" | "domains" | "subdomains" | "databases" | "mailboxes" | "cron_jobs";
  status: "open" | "acknowledged" | "resolved";
  current_value: number;
  limit_value: number;
  message: string;
  detected_at: string;
  resolved_at: string | null;
  sites?: { id: string; domain: string } | null;
}

export const useHostingPackages = () => useQuery({
  queryKey: ["hosting-packages"],
  queryFn: async () => {
    const { data, error } = await (supabase as any).from("hosting_packages").select("*").order("price_usd", { ascending: true });
    if (error) throw error;
    return (data ?? []) as HostingPackage[];
  },
});

export const useResellerAccounts = () => useQuery({
  queryKey: ["reseller-accounts"],
  queryFn: async () => {
    const { data, error } = await (supabase as any).from("reseller_accounts").select("*, profiles(id, email, full_name)").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ResellerAccount[];
  },
});

export const useSiteHostingAssignments = () => useQuery({
  queryKey: ["site-hosting-assignments"],
  queryFn: async () => {
    const { data, error } = await (supabase as any).from("site_hosting_assignments").select("*, sites(id, domain, status, storage_used_mb, storage_limit_mb, bandwidth_used_gb, bandwidth_limit_gb), hosting_packages(*), reseller_accounts(id, company_name)").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as SiteHostingAssignment[];
  },
});

export const useResourceOveruseAlerts = () => useQuery({
  queryKey: ["resource-overuse-alerts"],
  queryFn: async () => {
    const { data, error } = await (supabase as any).from("resource_overuse_alerts").select("*, sites(id, domain)").order("detected_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ResourceOveruseAlert[];
  },
});

function createHostingMutation(action: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("hosting-control-plane", { body: { action, ...body } });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hosting-packages"] });
      queryClient.invalidateQueries({ queryKey: ["reseller-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["site-hosting-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["resource-overuse-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export const useSaveHostingPackage = () => createHostingMutation("save_package");
export const useSaveResellerAccount = () => createHostingMutation("save_reseller");
export const useAssignHostingPackage = () => createHostingMutation("assign_package");
export const useSuspendHostedSite = () => createHostingMutation("suspend_site");
export const useUnsuspendHostedSite = () => createHostingMutation("unsuspend_site");
export const useRunResourceUsageAudit = () => createHostingMutation("run_usage_audit");
export const useResolveOveruseAlert = () => createHostingMutation("resolve_alert");
