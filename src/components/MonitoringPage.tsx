import { useState, useEffect } from "react";
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

const generateInitialData = (): MetricDataPoint[] => {
  const data: MetricDataPoint[] = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    data.push({
      time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      cpu: Math.floor(Math.random() * 40) + 20,
      memory: Math.floor(Math.random() * 30) + 35,
      disk: Math.floor(Math.random() * 10) + 20,
      network: Math.floor(Math.random() * 50) + 10,
    });
  }
  return data;
};

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
  const [metricsData, setMetricsData] = useState<MetricDataPoint[]>(generateInitialData);
  const [services, setServices] = useState<ServiceStatus[]>(initialServices);
  const [currentMetrics, setCurrentMetrics] = useState({
    cpu: 42,
    memory: 39,
    disk: 25,
    network: 65,
  });
  const [serverUptime, setServerUptime] = useState("45 days, 12 hours, 34 minutes");
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const newCpu = Math.min(100, Math.max(10, currentMetrics.cpu + (Math.random() - 0.5) * 10));
      const newMemory = Math.min(100, Math.max(20, currentMetrics.memory + (Math.random() - 0.5) * 5));
      const newDisk = Math.min(100, Math.max(15, currentMetrics.disk + (Math.random() - 0.5) * 2));
      const newNetwork = Math.min(100, Math.max(5, currentMetrics.network + (Math.random() - 0.5) * 15));

      setCurrentMetrics({
        cpu: Math.round(newCpu),
        memory: Math.round(newMemory),
        disk: Math.round(newDisk),
        network: Math.round(newNetwork),
      });

      setMetricsData((prev) => {
        const newData = [...prev.slice(1), {
          time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          cpu: Math.round(newCpu),
          memory: Math.round(newMemory),
          disk: Math.round(newDisk),
          network: Math.round(newNetwork),
        }];
        return newData;
      });

      // Update service last check times
      setServices((prev) =>
        prev.map((service) => ({
          ...service,
          lastCheck: "Just now",
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive, currentMetrics]);

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
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? "bg-success animate-pulse" : "bg-muted"}`} />
            <span className="text-sm text-muted-foreground">{isLive ? "Live" : "Paused"}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? "Pause" : "Resume"}
          </Button>
          <Button variant="outline" onClick={() => setMetricsData(generateInitialData())}>
            <RefreshCw className="w-4 h-4 mr-2" />
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
            <p className="text-xs text-muted-foreground mt-2">4 Cores @ 3.2 GHz</p>
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
            <p className="text-xs text-muted-foreground mt-2">6.2 GB of 16 GB</p>
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
            <p className="text-xs text-muted-foreground mt-2">124 GB of 500 GB</p>
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
            <p className="text-xs text-muted-foreground mt-2">1.2 Gb/s bandwidth</p>
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
