import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  HeartPulse,
  Mail,
  Network,
  Radar,
  RefreshCw,
  Server,
  ShieldAlert,
  Timer,
  XCircle,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SiteMetricsFilter } from "@/components/SiteMetricsFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatBytes,
  formatUptime,
  useLatestMetrics,
  useMetricsHistory,
  useMonitoringOverview,
} from "@/hooks/useSystemMetrics";

interface MetricDataPoint {
  time: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

const statusStyles = {
  healthy: "bg-success/20 text-success border-success/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  unknown: "bg-muted text-muted-foreground border-border",
  investigating: "bg-warning/20 text-warning border-warning/30",
  identified: "bg-info/20 text-info border-info/30",
  monitoring: "bg-primary/20 text-primary border-primary/30",
  resolved: "bg-success/20 text-success border-success/30",
  open: "bg-destructive/20 text-destructive border-destructive/30",
  acknowledged: "bg-warning/20 text-warning border-warning/30",
} as const;

const severityStyles = {
  info: "bg-primary/20 text-primary border-primary/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
} as const;

export const MonitoringPage = () => {
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(undefined);
  const { data: latestMetrics, isLoading: metricsLoading, refetch } = useLatestMetrics(selectedSiteId);
  const { data: metricsHistory } = useMetricsHistory(30, selectedSiteId);
  const { data: overview, refetch: refetchOverview } = useMonitoringOverview(selectedSiteId);

  const currentMetrics = {
    cpu: Math.round(latestMetrics?.cpu_percent || 0),
    memory: latestMetrics ? Math.round((latestMetrics.memory_used_mb / latestMetrics.memory_total_mb) * 100) : 0,
    disk: latestMetrics ? Math.round((latestMetrics.disk_used_gb / latestMetrics.disk_total_gb) * 100) : 0,
    network: Math.min(100, Math.round((latestMetrics?.network_in_mbps || 0) + (latestMetrics?.network_out_mbps || 0))),
  };

  const metricsData: MetricDataPoint[] = metricsHistory?.map((metric) => ({
    time: new Date(metric.recorded_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    cpu: Math.round(metric.cpu_percent),
    memory: Math.round((metric.memory_used_mb / metric.memory_total_mb) * 100),
    disk: Math.round((metric.disk_used_gb / metric.disk_total_gb) * 100),
    network: Math.round(metric.network_in_mbps + metric.network_out_mbps),
  })) || [];

  const openAlerts = overview?.alerts.filter((alert) => alert.status !== "resolved") ?? [];
  const anomalies = overview?.alerts.filter((alert) => alert.alert_type === "anomaly") ?? [];
  const sslAlerts = overview?.alerts.filter((alert) => alert.alert_type === "ssl_expiry") ?? [];
  const mailQueueAlerts = overview?.alerts.filter((alert) => alert.alert_type === "mail_queue") ?? [];
  const slowQueryAlerts = overview?.alerts.filter((alert) => alert.alert_type === "db_slow_query") ?? [];
  const activeIncidents = overview?.incidents.filter((incident) => incident.status !== "resolved") ?? [];

  const uptimePercent = useMemo(() => {
    const checks = overview?.httpChecks ?? [];
    if (!checks.length) return "99.95%";
    const healthy = checks.filter((check) => check.status === "healthy").length;
    return `${((healthy / checks.length) * 100).toFixed(2)}%`;
  }, [overview?.httpChecks]);

  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-destructive";
    if (value >= 70) return "bg-warning";
    return "bg-primary";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Server Monitoring</h2>
          <p className="text-muted-foreground">Agent-based metrics, per-site health, anomaly detection, and incident timeline.</p>
        </div>
        <div className="flex items-center gap-3">
          <SiteMetricsFilter selectedSiteId={selectedSiteId} onSiteChange={setSelectedSiteId} />
          <div className="flex items-center gap-2"><div className="h-2 w-2 animate-pulse rounded-full bg-success" /><span className="text-sm text-muted-foreground">Live</span></div>
          <Button variant="outline" onClick={() => { refetch(); refetchOverview(); }} disabled={metricsLoading}><RefreshCw className={`mr-2 h-4 w-4 ${metricsLoading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="glass-card lg:col-span-2"><CardContent className="flex items-center gap-4 p-4"><Server className="h-10 w-10 text-success" /><div><p className="text-sm text-muted-foreground">Server Uptime</p><p className="text-xl font-bold">{formatUptime(latestMetrics?.uptime_seconds)}</p></div><div className="ml-auto text-right"><p className="text-sm text-muted-foreground">HTTP Uptime</p><p className="text-xl font-bold">{uptimePercent}</p></div></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Monitoring Agents</p><p className="text-2xl font-bold">{overview?.agents.length ?? 0}</p><p className="text-xs text-muted-foreground">{overview?.agents.filter((agent) => agent.status === "healthy").length ?? 0} healthy</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Open Alerts</p><p className="text-2xl font-bold">{openAlerts.length}</p><p className="text-xs text-muted-foreground">{activeIncidents.length} active incidents</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card"><CardContent className="p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Cpu className="h-5 w-5 text-primary" /><span className="font-medium">CPU</span></div><span className="text-2xl font-bold">{currentMetrics.cpu}%</span></div><Progress value={currentMetrics.cpu} className={`h-2 ${getProgressColor(currentMetrics.cpu)}`} /></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-success" /><span className="font-medium">Memory</span></div><span className="text-2xl font-bold">{currentMetrics.memory}%</span></div><Progress value={currentMetrics.memory} className={`h-2 ${getProgressColor(currentMetrics.memory)}`} /><p className="mt-2 text-xs text-muted-foreground">{formatBytes(latestMetrics?.memory_used_mb || 0)} of {formatBytes(latestMetrics?.memory_total_mb || 16384)}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-warning" /><span className="font-medium">Disk</span></div><span className="text-2xl font-bold">{currentMetrics.disk}%</span></div><Progress value={currentMetrics.disk} className={`h-2 ${getProgressColor(currentMetrics.disk)}`} /></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Network className="h-5 w-5 text-info" /><span className="font-medium">Network</span></div><span className="text-2xl font-bold">{currentMetrics.network}%</span></div><Progress value={currentMetrics.network} className={`h-2 ${getProgressColor(currentMetrics.network)}`} /><p className="mt-2 text-xs text-muted-foreground">↓{(latestMetrics?.network_in_mbps || 0).toFixed(1)} ↑{(latestMetrics?.network_out_mbps || 0).toFixed(1)} Mbps</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />CPU & Memory Usage</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricsData}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                  <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" fill="url(#cpuGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="memory" stroke="hsl(var(--success))" fill="url(#memoryGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-info" />Network & Disk I/O</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="network" stroke="hsl(var(--info))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="disk" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" />Agent-based metrics collection</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {overview?.agents.length ? overview.agents.map((agent) => (
              <div key={agent.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3"><div><p className="font-medium">{agent.hostname}</p><p className="text-xs text-muted-foreground">{agent.agent_version} • last seen {agent.last_seen_at ? new Date(agent.last_seen_at).toLocaleString() : "never"}</p></div><Badge variant="outline" className={statusStyles[agent.status]}>{agent.status}</Badge></div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No monitoring agents have reported yet.</p>}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-success" />Per-site process health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {overview?.processHealth.length ? overview.processHealth.map((process) => (
              <div key={process.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3"><div><p className="font-medium">{process.process_name}</p><p className="text-xs text-muted-foreground">CPU {Number(process.cpu_percent).toFixed(1)}% • RAM {Number(process.memory_mb).toFixed(0)} MB • restarts {process.restart_count}</p></div><Badge variant="outline" className={statusStyles[process.status]}>{process.status}</Badge></div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No process health samples available.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Network className="h-5 w-5 text-info" />HTTP health & SSL coverage</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {overview?.httpChecks.length ? overview.httpChecks.map((check) => (
              <div key={check.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3"><div><p className="font-medium">{check.label}</p><p className="text-xs text-muted-foreground">{check.url} • {check.response_time_ms ?? "-"} ms • HTTP {check.last_status_code ?? check.expected_status}</p><p className="text-xs text-muted-foreground">SSL expiry: {check.ssl_expires_at ? new Date(check.ssl_expires_at).toLocaleDateString() : "not tracked"}</p></div><Badge variant="outline" className={statusStyles[check.status]}>{check.status}</Badge></div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No HTTP health checks configured.</p>}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-warning" />Alert families</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3"><div className="flex items-center gap-2"><Timer className="h-4 w-4 text-warning" /><span className="font-medium">SSL expiry alerts</span></div><p className="mt-2 text-2xl font-bold">{sslAlerts.length}</p></div>
            <div className="rounded-lg border border-border p-3"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-info" /><span className="font-medium">Mail queue alerts</span></div><p className="mt-2 text-2xl font-bold">{mailQueueAlerts.length}</p></div>
            <div className="rounded-lg border border-border p-3"><div className="flex items-center gap-2"><Server className="h-4 w-4 text-destructive" /><span className="font-medium">DB slow query alerts</span></div><p className="mt-2 text-2xl font-bold">{slowQueryAlerts.length}</p></div>
            <div className="rounded-lg border border-border p-3"><div className="flex items-center gap-2"><Radar className="h-4 w-4 text-primary" /><span className="font-medium">Anomaly detections</span></div><p className="mt-2 text-2xl font-bold">{anomalies.length}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Open alerts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {openAlerts.length ? openAlerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{alert.title}</p><p className="text-sm text-muted-foreground">{alert.message}</p><p className="text-xs text-muted-foreground">Detected {new Date(alert.detected_at).toLocaleString()} • {alert.source_type}</p></div><div className="flex gap-2"><Badge variant="outline" className={severityStyles[alert.severity]}>{alert.severity}</Badge><Badge variant="outline" className={statusStyles[alert.status]}>{alert.status}</Badge></div></div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No open alerts.</p>}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />Uptime / incident timeline</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {overview?.incidents.length ? overview.incidents.map((incident) => (
              <div key={incident.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{incident.title}</p><p className="text-sm text-muted-foreground">{incident.summary || "No summary provided."}</p><p className="text-xs text-muted-foreground">Started {new Date(incident.started_at).toLocaleString()}{incident.resolved_at ? ` • resolved ${new Date(incident.resolved_at).toLocaleString()}` : ""}</p></div><div className="flex gap-2"><Badge variant="outline" className={severityStyles[incident.severity]}>{incident.severity}</Badge><Badge variant="outline" className={statusStyles[incident.status]}>{incident.status}</Badge></div></div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No incidents recorded yet.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="glass-card"><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-8 w-8 text-success" /><div><p className="text-2xl font-bold">{overview?.processHealth.filter((item) => item.status === "healthy").length ?? 0}</p><p className="text-sm text-muted-foreground">Healthy processes</p></div></CardContent></Card>
        <Card className="glass-card"><CardContent className="flex items-center gap-3 p-4"><AlertTriangle className="h-8 w-8 text-warning" /><div><p className="text-2xl font-bold">{openAlerts.filter((item) => item.severity !== "critical").length}</p><p className="text-sm text-muted-foreground">Warnings</p></div></CardContent></Card>
        <Card className="glass-card"><CardContent className="flex items-center gap-3 p-4"><XCircle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{openAlerts.filter((item) => item.severity === "critical").length}</p><p className="text-sm text-muted-foreground">Critical alerts</p></div></CardContent></Card>
      </div>
    </div>
  );
};
