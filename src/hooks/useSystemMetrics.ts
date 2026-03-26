import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type SystemMetrics = Tables<"system_metrics">;
export type MonitoringAgent = Tables<"monitoring_agents">;
export type ProcessHealth = Tables<"site_process_health">;
export type HttpHealthCheck = Tables<"site_http_health_checks">;
export type MonitoringAlert = Tables<"monitoring_alerts">;
export type Incident = Tables<"site_incidents">;

export interface MetricsSummary {
  current: SystemMetrics;
  history: SystemMetrics[];
}

export interface MonitoringOverview {
  metrics: SystemMetrics | null;
  agents: MonitoringAgent[];
  processHealth: ProcessHealth[];
  httpChecks: HttpHealthCheck[];
  alerts: MonitoringAlert[];
  incidents: Incident[];
}

const authedFetch = async (params: URLSearchParams) => {
  const session = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-metrics?${params}`, {
    headers: {
      Authorization: `Bearer ${session.data.session?.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch monitoring data");
  }

  return response.json();
};

export const useLatestMetrics = (siteId?: string) => {
  return useQuery({
    queryKey: ["system-metrics", "latest", siteId],
    queryFn: async () => {
      const params = new URLSearchParams({ action: "latest" });
      if (siteId) params.append("site_id", siteId);
      const result = await authedFetch(params);
      return result.metrics as SystemMetrics;
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
};

export const useMetricsHistory = (limit = 60, siteId?: string) => {
  return useQuery({
    queryKey: ["system-metrics", "history", limit, siteId],
    queryFn: async () => {
      const params = new URLSearchParams({ action: "get", limit: limit.toString() });
      if (siteId) params.append("site_id", siteId);
      const result = await authedFetch(params);
      return (result.metrics as SystemMetrics[]).reverse();
    },
    refetchInterval: 30000,
  });
};

export const useMetricsSummary = () => {
  return useQuery({
    queryKey: ["system-metrics", "summary"],
    queryFn: async () => {
      const params = new URLSearchParams({ action: "summary" });
      const result = await authedFetch(params);
      return result as MetricsSummary;
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
};

export const useMonitoringOverview = (siteId?: string) => {
  return useQuery({
    queryKey: ["monitoring-overview", siteId],
    queryFn: async () => {
      const [metricsRes, agentsRes, processRes, httpRes, alertsRes, incidentsRes] = await Promise.all([
        supabase.from("system_metrics").select("*").order("recorded_at", { ascending: false }).limit(1).maybeSingle().then(({ data, error }) => {
          if (error) throw error;
          return data as SystemMetrics | null;
        }),
        supabase.from("monitoring_agents").select("*").order("last_seen_at", { ascending: false }).then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []) as MonitoringAgent[];
        }),
        supabase.from("site_process_health").select("*").order("checked_at", { ascending: false }).then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []) as ProcessHealth[];
        }),
        supabase.from("site_http_health_checks").select("*").order("checked_at", { ascending: false }).then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []) as HttpHealthCheck[];
        }),
        supabase.from("monitoring_alerts").select("*").order("detected_at", { ascending: false }).limit(20).then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []) as MonitoringAlert[];
        }),
        supabase.from("site_incidents").select("*").order("started_at", { ascending: false }).limit(20).then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []) as Incident[];
        }),
      ]);

      const filterBySite = <T extends { site_id?: string | null }>(rows: T[]) => siteId ? rows.filter((row) => row.site_id === siteId) : rows;

      return {
        metrics: metricsRes,
        agents: filterBySite(agentsRes),
        processHealth: filterBySite(processRes),
        httpChecks: filterBySite(httpRes),
        alerts: filterBySite(alertsRes),
        incidents: filterBySite(incidentsRes),
      } satisfies MonitoringOverview;
    },
    refetchInterval: 15000,
    staleTime: 5000,
  });
};

export const formatUptime = (seconds?: number | null): string => {
  if (!seconds) return "N/A";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const formatBytes = (mb: number): string => {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
};
