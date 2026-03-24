import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Loader2,
  Mail,
  Play,
  Power,
  RefreshCw,
  Server,
  Settings2,
  Shield,
  TerminalSquare,
  Wrench,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useApplyPackageUpdate,
  useRunServiceAction,
  useSystemServices,
  type SystemService,
} from "@/hooks/useSystemServices";
import { cn } from "@/lib/utils";

const serviceIcons: Record<string, typeof Server> = {
  nginx: Server,
  mysql: Database,
  "php-fpm": TerminalSquare,
  redis: Database,
  postfix: Mail,
  fail2ban: Shield,
};

const statusConfig = {
  running: { className: "bg-success/20 text-success border-success/30", dot: "bg-success", label: "Running" },
  stopped: { className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground", label: "Stopped" },
  restarting: { className: "bg-warning/20 text-warning border-warning/30", dot: "bg-warning", label: "Restarting" },
  failed: { className: "bg-destructive/20 text-destructive border-destructive/30", dot: "bg-destructive", label: "Failed" },
} as const;

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const getMemoryPercent = (service: SystemService) => {
  const memoryLimit = service.limitItems.find((item) => item.key === "memory_max")?.value;
  if (!memoryLimit) return null;

  const raw = Number.parseFloat(memoryLimit);
  if (Number.isNaN(raw) || raw <= 0) return null;

  const normalizedLimit = memoryLimit.toLowerCase().endsWith("g") ? raw * 1024 : raw;
  return Math.min(100, Math.round((Number(service.memory_usage_mb) / normalizedLimit) * 100));
};

const getServiceIcon = (serviceName: string) => serviceIcons[serviceName] ?? Server;

export const SystemServices = () => {
  const { data: services = [], isLoading, isError, refetch, isFetching } = useSystemServices();
  const runAction = useRunServiceAction();
  const applyPackageUpdate = useApplyPackageUpdate();
  const [selectedService, setSelectedService] = useState<SystemService | null>(null);

  const summary = useMemo(() => {
    const running = services.filter((service) => service.status === "running").length;
    const failed = services.filter((service) => service.status === "failed").length;
    const pendingUpdates = services.reduce((count, service) => count + service.packageUpdates.filter((update) => update.status !== "applied").length, 0);
    const scheduledMaintenance = services.reduce((count, service) => count + service.maintenanceActions.filter((action) => action.is_enabled).length, 0);

    return { total: services.length, running, failed, pendingUpdates, scheduledMaintenance };
  }, [services]);

  const topServices = services.slice(0, 5);

  return (
    <>
      <Card className="glass-card animate-fade-in">
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" />System Services</CardTitle>
            <CardDescription>Control service runs, inspect dependency graphs, package updates, journals, limits, and scheduled maintenance.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-lg border border-border bg-background/60 p-4"><p className="text-sm text-muted-foreground">Tracked services</p><p className="mt-2 text-2xl font-bold">{summary.total}</p></div>
            <div className="rounded-lg border border-border bg-background/60 p-4"><p className="text-sm text-muted-foreground">Running</p><p className="mt-2 text-2xl font-bold text-success">{summary.running}</p></div>
            <div className="rounded-lg border border-border bg-background/60 p-4"><p className="text-sm text-muted-foreground">Pending updates</p><p className="mt-2 text-2xl font-bold text-warning">{summary.pendingUpdates}</p></div>
            <div className="rounded-lg border border-border bg-background/60 p-4"><p className="text-sm text-muted-foreground">Maintenance jobs</p><p className="mt-2 text-2xl font-bold text-info">{summary.scheduledMaintenance}</p></div>
          </div>

          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-border">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Unable to load service operations. Verify the new control-plane tables and policies are available.
            </div>
          ) : (
            <div className="space-y-3">
              {topServices.map((service) => {
                const Icon = getServiceIcon(service.service_name);
                const memoryPercent = getMemoryPercent(service);
                const pendingUpdates = service.packageUpdates.filter((update) => update.status !== "applied").length;
                const status = statusConfig[service.status];

                return (
                  <div
                    key={service.id}
                    className="rounded-xl border border-border bg-background/50 p-4 transition-colors hover:bg-background/80"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{service.display_name}</p>
                            <Badge variant="outline" className={status.className}><span className={cn("mr-1.5 inline-block h-2 w-2 rounded-full", status.dot)} />{status.label}</Badge>
                            {pendingUpdates > 0 && <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">{pendingUpdates} update{pendingUpdates > 1 ? "s" : ""}</Badge>}
                            {service.maintenanceActions.some((action) => action.is_enabled) && <Badge variant="outline" className="bg-info/20 text-info border-info/30">maintenance scheduled</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{service.service_name} • v{service.version ?? "unknown"} • {Number(service.memory_usage_mb).toFixed(0)} MB RAM</p>
                          {memoryPercent !== null && (
                            <div className="max-w-sm space-y-1">
                              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Memory budget</span><span>{memoryPercent}%</span></div>
                              <Progress value={memoryPercent} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => runAction.mutate({ service, action: service.status === "running" ? "stop" : "start" })} disabled={runAction.isPending}>
                          <Power className="mr-2 h-4 w-4" />{service.status === "running" ? "Stop" : "Start"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => runAction.mutate({ service, action: "restart" })} disabled={runAction.isPending}>
                          <RefreshCw className="mr-2 h-4 w-4" />Restart
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => runAction.mutate({ service, action: "config_test" })} disabled={runAction.isPending}>
                          <Play className="mr-2 h-4 w-4" />Config test
                        </Button>
                        <Button size="sm" onClick={() => setSelectedService(service)}>Open console</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedService)} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-5xl border-border bg-card">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">{selectedService.display_name}<Badge variant="outline" className={statusConfig[selectedService.status].className}>{statusConfig[selectedService.status].label}</Badge></DialogTitle>
                <DialogDescription>
                  Control-plane view for {selectedService.service_name}. Review the latest runs, packages, journals, dependency graph, limits, and maintenance windows.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border p-4"><p className="text-sm text-muted-foreground">Version</p><p className="mt-2 text-lg font-semibold">{selectedService.version ?? "unknown"}</p></div>
                <div className="rounded-lg border border-border p-4"><p className="text-sm text-muted-foreground">Config command</p><p className="mt-2 text-sm font-medium">{selectedService.config_test_command ?? "Not configured"}</p></div>
                <div className="rounded-lg border border-border p-4"><p className="text-sm text-muted-foreground">Last test result</p><div className="mt-2 flex items-center gap-2 text-sm font-medium">{selectedService.last_config_test_passed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}{selectedService.last_config_test_passed ? "Passing" : "Needs attention"}</div></div>
              </div>

              <Tabs defaultValue="runs" className="mt-2">
                <TabsList className="grid w-full grid-cols-5 bg-secondary">
                  <TabsTrigger value="runs">Runs</TabsTrigger>
                  <TabsTrigger value="packages">Packages</TabsTrigger>
                  <TabsTrigger value="journal">Journal</TabsTrigger>
                  <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>

                <TabsContent value="runs" className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => runAction.mutate({ service: selectedService, action: "start" })} disabled={runAction.isPending}>Start</Button>
                    <Button size="sm" variant="outline" onClick={() => runAction.mutate({ service: selectedService, action: "stop" })} disabled={runAction.isPending}>Stop</Button>
                    <Button size="sm" variant="outline" onClick={() => runAction.mutate({ service: selectedService, action: "restart" })} disabled={runAction.isPending}>Restart</Button>
                    <Button size="sm" onClick={() => runAction.mutate({ service: selectedService, action: "config_test" })} disabled={runAction.isPending}>Run config test</Button>
                  </div>
                  <div className="rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Action</TableHead><TableHead>Status</TableHead><TableHead>Requested</TableHead><TableHead>Output</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedService.controlRuns.length ? selectedService.controlRuns.map((run) => (
                          <TableRow key={run.id}>
                            <TableCell className="font-medium">{run.action}</TableCell>
                            <TableCell><Badge variant="outline" className={statusConfig[run.status].className}>{statusConfig[run.status].label}</Badge></TableCell>
                            <TableCell>{formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}</TableCell>
                            <TableCell className="max-w-md truncate text-muted-foreground">{run.output ?? "—"}</TableCell>
                          </TableRow>
                        )) : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No control runs recorded yet.</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="packages" className="space-y-3">
                  <div className="rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Package</TableHead><TableHead>Current</TableHead><TableHead>Target</TableHead><TableHead>Status</TableHead><TableHead /></TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedService.packageUpdates.length ? selectedService.packageUpdates.map((item) => {
                          const isApplied = item.status === "applied";
                          return (
                            <TableRow key={item.id}>
                              <TableCell><div className="font-medium">{item.package_name}</div><div className="text-xs text-muted-foreground">{item.summary ?? "No release summary available."}</div></TableCell>
                              <TableCell>{item.current_version}</TableCell>
                              <TableCell>{item.target_version}</TableCell>
                              <TableCell><Badge variant="outline" className={isApplied ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"}>{item.status}</Badge></TableCell>
                              <TableCell className="text-right"><Button size="sm" variant="outline" disabled={isApplied || applyPackageUpdate.isPending} onClick={() => applyPackageUpdate.mutate({ service: selectedService, update: item })}>Apply</Button></TableCell>
                            </TableRow>
                          );
                        }) : <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No package updates available.</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="journal" className="space-y-3">
                  <ScrollArea className="h-80 rounded-lg border border-border p-4">
                    <div className="space-y-3">
                      {selectedService.journalEntries.length ? selectedService.journalEntries.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2"><Badge variant="outline">{entry.severity}</Badge><span className="text-sm font-medium">{entry.unit}</span></div>
                              <p className="mt-2 text-sm text-foreground">{entry.message}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(entry.logged_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      )) : <p className="text-sm text-muted-foreground">No journal entries recorded for this service.</p>}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="dependencies" className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center gap-2"><TerminalSquare className="h-4 w-4 text-primary" /><h4 className="font-semibold">Dependency graph</h4></div>
                    <div className="space-y-2">
                      {selectedService.dependencyItems.length ? selectedService.dependencyItems.map((dependency) => (
                        <div key={dependency.name} className="rounded-md border border-border bg-background/60 px-3 py-2 text-sm">{dependency.name}</div>
                      )) : <p className="text-sm text-muted-foreground">This service has no declared dependencies.</p>}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /><h4 className="font-semibold">Resource limits</h4></div>
                    <div className="space-y-3">
                      {selectedService.limitItems.length ? selectedService.limitItems.map((limit) => (
                        <div key={limit.key}>
                          <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{limit.key}</span><span className="font-medium">{limit.value}</span></div>
                          <Separator className="mt-2" />
                        </div>
                      )) : <p className="text-sm text-muted-foreground">No resource limits defined.</p>}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => runAction.mutate({ service: selectedService, action: "maintenance" })} disabled={runAction.isPending}><Wrench className="mr-2 h-4 w-4" />Log maintenance run</Button>
                  </div>
                  <div className="grid gap-3">
                    {selectedService.maintenanceActions.length ? selectedService.maintenanceActions.map((action) => (
                      <div key={action.id} className="rounded-lg border border-border p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-2"><p className="font-semibold">{action.action_name}</p>{action.is_enabled ? <Badge variant="outline" className="bg-success/20 text-success border-success/30">enabled</Badge> : <Badge variant="outline">disabled</Badge>}</div>
                            <p className="mt-1 text-sm text-muted-foreground">Cron: {action.cron_expression}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" />Next: {formatDateTime(action.next_run_at)}</div>
                            <div className="mt-1">Last: {formatDateTime(action.last_run_at)}</div>
                          </div>
                        </div>
                      </div>
                    )) : <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No maintenance actions scheduled.</div>}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
