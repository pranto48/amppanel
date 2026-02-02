import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMetricsHistory, SystemMetrics } from "@/hooks/useSystemMetrics";
import { Loader2 } from "lucide-react";

interface ResourceChartProps {
  siteId?: string;
}

export const ResourceChart = ({ siteId }: ResourceChartProps) => {
  const { data: metricsHistory, isLoading } = useMetricsHistory(60, siteId);

  // Transform metrics data for the chart
  const chartData = metricsHistory?.map((metric, index) => {
    const time = new Date(metric.recorded_at);
    const timeLabel = index === metricsHistory.length - 1 
      ? "Now" 
      : time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    
    return {
      time: timeLabel,
      cpu: Math.round(metric.cpu_percent),
      ram: Math.round((metric.memory_used_mb / metric.memory_total_mb) * 100),
      network: Math.round(metric.network_in_mbps + metric.network_out_mbps),
    };
  }) || [];

  // Show at most 12 data points for readability
  const displayData = chartData.length > 12 
    ? chartData.filter((_, i) => i % Math.ceil(chartData.length / 12) === 0 || i === chartData.length - 1)
    : chartData;

  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">Resource Usage (Live)</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">CPU</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">RAM</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-info" />
            <span className="text-xs text-muted-foreground">Network</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            No metrics data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="networkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 15%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(215, 20%, 55%)" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 55%)" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 10%)",
                  border: "1px solid hsl(222, 47%, 15%)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px -4px rgba(0,0,0,0.5)",
                }}
                labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                itemStyle={{ color: "hsl(215, 20%, 55%)" }}
                formatter={(value: number, name: string) => {
                  if (name === "network") return [`${value} Mbps`, "Network"];
                  return [`${value}%`, name.toUpperCase()];
                }}
              />
              <Area 
                type="monotone" 
                dataKey="cpu" 
                stroke="hsl(187, 85%, 53%)" 
                strokeWidth={2}
                fill="url(#cpuGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="ram" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                fill="url(#ramGradient)" 
              />
              <Area 
                type="monotone" 
                dataKey="network" 
                stroke="hsl(199, 89%, 48%)" 
                strokeWidth={2}
                fill="url(#networkGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
