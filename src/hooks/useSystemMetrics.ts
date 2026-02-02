import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemMetrics {
  id?: string;
  site_id?: string | null;
  cpu_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_used_gb: number;
  disk_total_gb: number;
  network_in_mbps: number;
  network_out_mbps: number;
  load_avg_1m?: number;
  load_avg_5m?: number;
  load_avg_15m?: number;
  uptime_seconds?: number;
  recorded_at: string;
}

export interface MetricsSummary {
  current: SystemMetrics;
  history: SystemMetrics[];
}

export const useLatestMetrics = (siteId?: string) => {
  return useQuery({
    queryKey: ["system-metrics", "latest", siteId],
    queryFn: async () => {
      const params = new URLSearchParams({ action: "latest" });
      if (siteId) params.append("site_id", siteId);

      const { data, error } = await supabase.functions.invoke("system-metrics", {
        body: null,
        method: "GET",
      });

      // Use query params via the function URL
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-metrics?${params}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const result = await response.json();
      return result.metrics as SystemMetrics;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
};

export const useMetricsHistory = (limit = 60, siteId?: string) => {
  return useQuery({
    queryKey: ["system-metrics", "history", limit, siteId],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        action: "get", 
        limit: limit.toString() 
      });
      if (siteId) params.append("site_id", siteId);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-metrics?${params}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch metrics history");
      }

      const result = await response.json();
      return (result.metrics as SystemMetrics[]).reverse(); // Oldest first for charts
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useMetricsSummary = () => {
  return useQuery({
    queryKey: ["system-metrics", "summary"],
    queryFn: async () => {
      const params = new URLSearchParams({ action: "summary" });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/system-metrics?${params}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch metrics summary");
      }

      const result = await response.json();
      return result as MetricsSummary;
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
};

export const formatUptime = (seconds?: number): string => {
  if (!seconds) return "N/A";
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const formatBytes = (mb: number): string => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
};
