import { Globe, MoreVertical, ExternalLink, CheckCircle, AlertCircle, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSites, useDeleteSite } from "@/hooks/useSites";
import { AddSiteDialog } from "./AddSiteDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  active: { icon: CheckCircle, class: "text-success", label: "Active" },
  pending: { icon: Clock, class: "text-warning", label: "Pending" },
  suspended: { icon: AlertCircle, class: "text-muted-foreground", label: "Suspended" },
  error: { icon: AlertCircle, class: "text-destructive", label: "Error" },
};

const siteTypeLabels: Record<string, string> = {
  wordpress: "WordPress",
  nodejs: "Node.js",
  python: "Python",
  php: "PHP",
  static: "Static",
  custom: "Custom",
};

export const SitesTable = () => {
  const { data: sites, isLoading } = useSites();
  const deleteSite = useDeleteSite();
  const { toast } = useToast();

  const handleDelete = async (id: string, domain: string) => {
    try {
      await deleteSite.mutateAsync(id);
      toast({
        title: "Site deleted",
        description: `${domain} has been removed.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: error.message,
      });
    }
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Managed Sites</h3>
        <AddSiteDialog />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Domain</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SSL</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">PHP</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Storage</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  Loading sites...
                </td>
              </tr>
            ) : sites && sites.length > 0 ? (
              sites.map((site) => {
                const StatusIcon = statusConfig[site.status as keyof typeof statusConfig]?.icon || Clock;
                const statusClass = statusConfig[site.status as keyof typeof statusConfig]?.class || "text-muted-foreground";
                const statusLabel = statusConfig[site.status as keyof typeof statusConfig]?.label || site.status;
                const storagePercent = Math.round((site.storage_used_mb / site.storage_limit_mb) * 100);

                return (
                  <tr key={site.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-primary" />
                        </div>
                        <p className="font-medium text-foreground">{site.domain}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                        {siteTypeLabels[site.site_type] || site.site_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn("w-4 h-4", statusClass)} />
                        <span className={cn("text-sm", statusClass)}>{statusLabel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-full",
                        site.ssl_enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {site.ssl_enabled ? "Secured" : "None"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {site.php_version || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">
                          {site.storage_used_mb} / {site.storage_limit_mb} MB
                        </p>
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              storagePercent > 80 ? "bg-destructive" : storagePercent > 50 ? "bg-warning" : "bg-success"
                            )}
                            style={{ width: `${storagePercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(site.id, site.domain)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Site
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  No sites yet. Click "Add Site" to create your first site.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
