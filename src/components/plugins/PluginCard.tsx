import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plugin, InstalledPlugin, PluginStatus } from "@/hooks/usePlugins";
import { 
  Package, Loader2, Check, AlertCircle, Download, Trash2, RefreshCw,
  Globe, Mail, Upload, Network, Archive, Database, Folder, Shield, Activity, Zap, Lock, BarChart2, PieChart, Inbox
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface PluginCardProps {
  plugin: Plugin;
  installedPlugin?: InstalledPlugin;
  onInstall: (pluginId: string) => void;
  onUninstall: (installedPluginId: string) => void;
  onHealthCheck: (installedPluginId: string) => void;
  isInstalling?: boolean;
  isUninstalling?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Globe, Mail, Upload, Network, Archive, Database, Folder, Shield, Activity, 
  Zap, Lock, BarChart2, PieChart, Inbox, Package
};

const categoryColors: Record<string, string> = {
  web_server: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  email: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ftp: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  dns: "bg-green-500/10 text-green-500 border-green-500/20",
  backup: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  database: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  file_manager: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  security: "bg-red-500/10 text-red-500 border-red-500/20",
  monitoring: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  other: "bg-muted text-muted-foreground border-border",
};

const statusConfig: Record<PluginStatus, { label: string; color: string; icon: LucideIcon }> = {
  available: { label: "Available", color: "bg-muted text-muted-foreground", icon: Download },
  installing: { label: "Installing", color: "bg-yellow-500/10 text-yellow-500", icon: Loader2 },
  installed: { label: "Installed", color: "bg-green-500/10 text-green-500", icon: Check },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-500", icon: AlertCircle },
  uninstalling: { label: "Uninstalling", color: "bg-orange-500/10 text-orange-500", icon: Loader2 },
};

export function PluginCard({
  plugin,
  installedPlugin,
  onInstall,
  onUninstall,
  onHealthCheck,
  isInstalling,
  isUninstalling,
}: PluginCardProps) {
  const IconComponent = plugin.icon && iconMap[plugin.icon] ? iconMap[plugin.icon] : Package;

  const status = installedPlugin?.status || 'available';
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  const isProcessing = isInstalling || isUninstalling || status === 'installing' || status === 'uninstalling';

  return (
    <Card className="glass-card hover:border-primary/30 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {plugin.display_name}
                {plugin.is_core && (
                  <Badge variant="outline" className="text-xs">Core</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-xs ${categoryColors[plugin.category]}`}>
                  {plugin.category.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">v{plugin.version}</span>
              </div>
            </div>
          </div>
          <Badge className={`${statusInfo.color} flex items-center gap-1`}>
            <StatusIcon className={`w-3 h-3 ${status === 'installing' || status === 'uninstalling' ? 'animate-spin' : ''}`} />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <CardDescription className="text-sm line-clamp-2">
          {plugin.description}
        </CardDescription>
        {installedPlugin?.error_message && (
          <p className="text-xs text-destructive mt-2">{installedPlugin.error_message}</p>
        )}
        {installedPlugin?.is_healthy === false && status === 'installed' && (
          <p className="text-xs text-warning mt-2">Service may be unhealthy</p>
        )}
      </CardContent>
      <CardFooter className="pt-0 gap-2">
        {status === 'available' || status === 'failed' ? (
          <Button
            size="sm"
            onClick={() => onInstall(plugin.id)}
            disabled={isProcessing}
            className="w-full"
          >
            {isInstalling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Install
              </>
            )}
          </Button>
        ) : status === 'installed' ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onHealthCheck(installedPlugin!.id)}
              disabled={isProcessing}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onUninstall(installedPlugin!.id)}
              disabled={isProcessing}
              className="flex-1"
            >
              {isUninstalling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Uninstall
                </>
              )}
            </Button>
          </>
        ) : (
          <Button size="sm" disabled className="w-full">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {status === 'installing' ? 'Installing...' : 'Uninstalling...'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
