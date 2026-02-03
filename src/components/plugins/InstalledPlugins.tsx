import { useState } from "react";
import { useInstalledPlugins, useUninstallPlugin, usePluginHealthCheck, usePluginInstallationLogs, InstalledPlugin } from "@/hooks/usePlugins";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, RefreshCw, Trash2, FileText, CheckCircle, XCircle, Clock, Loader2,
  Globe, Mail, Upload, Network, Archive, Database, Folder, Shield, Activity, Zap, Lock, BarChart2, PieChart, Inbox
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const iconMap: Record<string, LucideIcon> = {
  Globe, Mail, Upload, Network, Archive, Database, Folder, Shield, Activity, 
  Zap, Lock, BarChart2, PieChart, Inbox, Package
};

function PluginLogs({ installedPluginId }: { installedPluginId: string }) {
  const { data: logs, isLoading } = usePluginInstallationLogs(installedPluginId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading logs...</div>;
  }

  if (!logs?.length) {
    return <div className="text-sm text-muted-foreground">No installation logs yet.</div>;
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-2">
        {logs.map(log => (
          <div
            key={log.id}
            className={`p-3 rounded-lg text-sm font-mono ${
              log.is_error ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={log.is_error ? 'text-destructive' : 'text-muted-foreground'}>
                {log.action}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </span>
            </div>
            {log.output && (
              <pre className="text-xs whitespace-pre-wrap break-all">{log.output}</pre>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function InstalledPluginCard({ 
  ip, 
  onUninstall, 
  onHealthCheck, 
  isHealthCheckPending,
  healthCheckId,
  onSelectLogs 
}: { 
  ip: InstalledPlugin; 
  onUninstall: (id: string) => void;
  onHealthCheck: (id: string) => void;
  isHealthCheckPending: boolean;
  healthCheckId?: string;
  onSelectLogs: (id: string) => void;
}) {
  const plugin = ip.plugin;
  if (!plugin) return null;

  const IconComponent = plugin.icon && iconMap[plugin.icon] ? iconMap[plugin.icon] : Package;
  const isProcessing = ip.status === 'installing' || ip.status === 'uninstalling';

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{plugin.display_name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>v{ip.installed_version || plugin.version}</span>
                {ip.installed_at && (
                  <>
                    <span>•</span>
                    <span>Installed {formatDistanceToNow(new Date(ip.installed_at), { addSuffix: true })}</span>
                  </>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ip.status === 'installed' && (
              <Badge
                variant="outline"
                className={`flex items-center gap-1 ${
                  ip.is_healthy
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                }`}
              >
                {ip.is_healthy ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {ip.is_healthy ? 'Healthy' : 'Unhealthy'}
              </Badge>
            )}
            {isProcessing && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {ip.status === 'installing' ? 'Installing' : 'Uninstalling'}
              </Badge>
            )}
            {ip.status === 'failed' && (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-2 pt-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onHealthCheck(ip.id)}
          disabled={isProcessing || ip.status !== 'installed'}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isHealthCheckPending && healthCheckId === ip.id ? 'animate-spin' : ''}`} />
          Health Check
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={() => onSelectLogs(ip.id)}>
              <FileText className="w-4 h-4 mr-2" />
              Logs
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Installation Logs - {plugin.display_name}</DialogTitle>
              <DialogDescription>
                View installation and operation logs for this plugin.
              </DialogDescription>
            </DialogHeader>
            <PluginLogs installedPluginId={ip.id} />
          </DialogContent>
        </Dialog>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onUninstall(ip.id)}
          disabled={isProcessing}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Uninstall
        </Button>
        {ip.last_health_check && (
          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last check: {formatDistanceToNow(new Date(ip.last_health_check), { addSuffix: true })}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

export function InstalledPlugins() {
  const { data: installedPlugins, isLoading } = useInstalledPlugins();
  const uninstallPlugin = useUninstallPlugin();
  const healthCheck = usePluginHealthCheck();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const activePlugins = installedPlugins?.filter(ip => ip.status === 'installed') || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (activePlugins.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No plugins installed</h3>
          <p className="text-muted-foreground text-center">
            Visit the Marketplace to browse and install server plugins.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Installed Plugins</h2>
          <p className="text-muted-foreground">{activePlugins.length} active services</p>
        </div>
      </div>

      <div className="grid gap-4">
        {installedPlugins?.map(ip => (
          <InstalledPluginCard
            key={ip.id}
            ip={ip}
            onUninstall={(id) => uninstallPlugin.mutate(id)}
            onHealthCheck={(id) => healthCheck.mutate(id)}
            isHealthCheckPending={healthCheck.isPending}
            healthCheckId={healthCheck.variables}
            onSelectLogs={setSelectedLogId}
          />
        ))}
      </div>
    </div>
  );
}
