import { useState } from "react";
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Activity, 
  Server,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import { useLatestMetrics, useMetricsHistory, formatBytes, formatUptime } from "@/hooks/useSystemMetrics";
import { SiteMetricsFilter } from "@/components/SiteMetricsFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface MetricDataPoint {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface ServiceStatus {
  name: string;
  status: "online" | "warning" | "offline";
  uptime: string;
  lastCheck: string;
}


const initialServices: ServiceStatus[] = [
  { name: "Apache/Nginx", status: "online", uptime: "99.98%", lastCheck: "10s ago" },
  { name: "MySQL Server", status: "online", uptime: "99.95%", lastCheck: "10s ago" },
  { name: "PostgreSQL", status: "online", uptime: "99.99%", lastCheck: "10s ago" },
  { name: "PHP-FPM", status: "online", uptime: "99.92%", lastCheck: "10s ago" },
  { name: "Redis Cache", status: "warning", uptime: "98.50%", lastCheck: "10s ago" },
  { name: "Mail Server", status: "online", uptime: "99.87%", lastCheck: "10s ago" },
  { name: "FTP Server", status: "online", uptime: "99.99%", lastCheck: "10s ago" },
  { name: "DNS Server", status: "online", uptime: "100%", lastCheck: "10s ago" },
];

export const MonitoringPage = () => {
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(undefined);
  const [services, setServices] = useState<ServiceStatus[]>(initialServices);
  
  // Use real metrics from the database
  const { data: latestMetrics, isLoading: metricsLoading, refetch } = useLatestMetrics(selectedSiteId);
  const { data: metricsHistory } = useMetricsHistory(30, selectedSiteId);
  
  // Transform real metrics for display
  const currentMetrics = {
    cpu: Math.round(latestMetrics?.cpu_percent || 0),
    memory: latestMetrics ? Math.round((latestMetrics.memory_used_mb / latestMetrics.memory_total_mb) * 100) : 0,
    disk: latestMetrics ? Math.round((latestMetrics.disk_used_gb / latestMetrics.disk_total_gb) * 100) : 0,
    network: Math.min(100, Math.round((latestMetrics?.network_in_mbps || 0) + (latestMetrics?.network_out_mbps || 0))),
  };
  
  const serverUptime = formatUptime(latestMetrics?.uptime_seconds);
  
  // Transform history for charts
  const metricsData: MetricDataPoint[] = metricsHistory?.map((metric) => {
    const time = new Date(metric.recorded_at);
    return {
      time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      cpu: Math.round(metric.cpu_percent),
      memory: Math.round((metric.memory_used_mb / metric.memory_total_mb) * 100),
      disk: Math.round((metric.disk_used_gb / metric.disk_total_gb) * 100),
      network: Math.round(metric.network_in_mbps + metric.network_out_mbps),
    };
  }) || [];

  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "online":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "offline":
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "online":
        return <Badge className="bg-success/20 text-success border-success/30">Online</Badge>;
      case "warning":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Warning</Badge>;
      case "offline":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Offline</Badge>;
    }
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-destructive";
    if (value >= 70) return "bg-warning";
    return "bg-primary";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Server Monitoring</h2>
          <p className="text-muted-foreground">Real-time server metrics and service status</p>
        </div>
        <div className="flex items-center gap-3">
          <SiteMetricsFilter 
            selectedSiteId={selectedSiteId} 
            onSiteChange={setSelectedSiteId} 
          />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={metricsLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${metricsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Server Uptime */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
              <Server className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Server Uptime</p>
              <p className="text-xl font-bold text-foreground">{serverUptime}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Since last restart</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">CPU</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{currentMetrics.cpu}%</span>
            </div>
            <Progress value={currentMetrics.cpu} className={`h-2 ${getProgressColor(currentMetrics.cpu)}`} />
            <p className="text-xs text-muted-foreground mt-2">Load: {latestMetrics?.load_avg_1m?.toFixed(2) || "N/A"}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MemoryStick className="w-5 h-5 text-success" />
                <span className="font-medium text-foreground">Memory</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{currentMetrics.memory}%</span>
            </div>
            <Progress value={currentMetrics.memory} className={`h-2 ${getProgressColor(currentMetrics.memory)}`} />
            <p className="text-xs text-muted-foreground mt-2">{formatBytes(latestMetrics?.memory_used_mb || 0)} of {formatBytes(latestMetrics?.memory_total_mb || 16384)}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-warning" />
                <span className="font-medium text-foreground">Disk</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{currentMetrics.disk}%</span>
            </div>
            <Progress value={currentMetrics.disk} className={`h-2 ${getProgressColor(currentMetrics.disk)}`} />
            <p className="text-xs text-muted-foreground mt-2">{(latestMetrics?.disk_used_gb || 0).toFixed(0)} GB of {(latestMetrics?.disk_total_gb || 500).toFixed(0)} GB</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-info" />
                <span className="font-medium text-foreground">Network</span>
              </div>
              <span className="text-2xl font-bold text-foreground">{currentMetrics.network}%</span>
            </div>
            <Progress value={currentMetrics.network} className={`h-2 ${getProgressColor(currentMetrics.network)}`} />
            <p className="text-xs text-muted-foreground mt-2">↓{(latestMetrics?.network_in_mbps || 0).toFixed(1)} ↑{(latestMetrics?.network_out_mbps || 0).toFixed(1)} Mbps</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory Chart */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              CPU & Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricsData}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#cpuGradient)"
                    strokeWidth={2}
                    name="CPU"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="hsl(var(--success))" 
                    fill="url(#memoryGradient)"
                    strokeWidth={2}
                    name="Memory"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">Memory</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network & Disk Chart */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="w-5 h-5 text-info" />
              Network & Disk I/O
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="network" 
                    stroke="hsl(var(--info))" 
                    strokeWidth={2}
                    dot={false}
                    name="Network"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="disk" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    dot={false}
                    name="Disk"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-info" />
                <span className="text-sm text-muted-foreground">Network</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm text-muted-foreground">Disk</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <div
                key={service.name}
                className="p-4 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(service.status)}
                    <span className="font-medium text-foreground text-sm">{service.name}</span>
                  </div>
                  {getStatusBadge(service.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Uptime: {service.uptime}</span>
                  <span>{service.lastCheck}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {services.filter((s) => s.status === "online").length}
                </p>
                <p className="text-sm text-muted-foreground">Services Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {services.filter((s) => s.status === "warning").length}
                </p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {services.filter((s) => s.status === "offline").length}
                </p>
                <p className="text-sm text-muted-foreground">Services Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
