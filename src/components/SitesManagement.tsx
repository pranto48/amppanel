import { useState } from "react";
import { 
  Globe, 
  MoreVertical, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Trash2,
  Settings,
  Shield,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSites, useDeleteSite, useUpdateSite } from "@/hooks/useSites";
import { AddSiteDialog } from "@/components/AddSiteDialog";
import { EditSiteDialog } from "@/components/EditSiteDialog";
import { useToast } from "@/hooks/use-toast";
import { useLogActivity } from "@/hooks/useActivityLogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type Site = Tables<"sites">;

const statusConfig = {
  active: { icon: CheckCircle, class: "text-success bg-success/10", label: "Active" },
  pending: { icon: Clock, class: "text-warning bg-warning/10", label: "Pending" },
  suspended: { icon: AlertCircle, class: "text-muted-foreground bg-muted", label: "Suspended" },
  error: { icon: AlertCircle, class: "text-destructive bg-destructive/10", label: "Error" },
};

const siteTypeLabels: Record<string, string> = {
  wordpress: "WordPress",
  nodejs: "Node.js",
  python: "Python",
  php: "PHP",
  static: "Static",
  custom: "Custom",
};

export const SitesManagement = () => {
  const { data: sites, isLoading, refetch } = useSites();
  const deleteSite = useDeleteSite();
  const updateSite = useUpdateSite();
  const { toast } = useToast();
  const { logSiteDeleted, logSiteUpdated } = useLogActivity();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  const handleDelete = async (id: string, domain: string) => {
    try {
      await deleteSite.mutateAsync(id);
      
      // Log activity
      logSiteDeleted(domain);
      
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

  const handleToggleSSL = async (site: Site) => {
    try {
      await updateSite.mutateAsync({
        id: site.id,
        ssl_enabled: !site.ssl_enabled,
      });
      
      // Log activity
      logSiteUpdated(site.domain, site.id, { ssl_enabled: !site.ssl_enabled });
      
      toast({
        title: site.ssl_enabled ? "SSL disabled" : "SSL enabled",
        description: `SSL has been ${site.ssl_enabled ? "disabled" : "enabled"} for ${site.domain}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update SSL",
        description: error.message,
      });
    }
  };

  const filteredSites = sites?.filter((site) => {
    const matchesSearch = site.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || site.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sites Management</h2>
          <p className="text-muted-foreground">Manage your domains, PHP versions, and SSL certificates</p>
        </div>
        <AddSiteDialog>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add New Site
          </Button>
        </AddSiteDialog>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-secondary border-border">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading sites...</p>
          </div>
        ) : filteredSites && filteredSites.length > 0 ? (
          filteredSites.map((site) => {
            const StatusIcon = statusConfig[site.status as keyof typeof statusConfig]?.icon || Clock;
            const statusClass = statusConfig[site.status as keyof typeof statusConfig]?.class || "text-muted-foreground bg-muted";
            const statusLabel = statusConfig[site.status as keyof typeof statusConfig]?.label || site.status;
            const storagePercent = Math.round((site.storage_used_mb / site.storage_limit_mb) * 100);
            const bandwidthPercent = Math.round((Number(site.bandwidth_used_gb) / site.bandwidth_limit_gb) * 100);

            return (
              <div key={site.id} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Domain Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-info/20 flex items-center justify-center shrink-0">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{site.domain}</h3>
                        {site.ssl_enabled && (
                          <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                          {siteTypeLabels[site.site_type] || site.site_type}
                        </span>
                        {site.php_version && (
                          <span className="text-xs text-muted-foreground">
                            PHP {site.php_version}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0", statusClass)}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{statusLabel}</span>
                  </div>

                  {/* SSL Status */}
                  <button
                    onClick={() => handleToggleSSL(site)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0",
                      site.ssl_enabled 
                        ? "bg-success/10 text-success hover:bg-success/20" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <Shield className="w-4 h-4" />
                    {site.ssl_enabled ? "SSL Active" : "Enable SSL"}
                  </button>

                  {/* Resource Usage */}
                  <div className="flex gap-6 shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Storage</p>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            storagePercent > 80 ? "bg-destructive" : storagePercent > 50 ? "bg-warning" : "bg-success"
                          )}
                          style={{ width: `${storagePercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{storagePercent}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Bandwidth</p>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            bandwidthPercent > 80 ? "bg-destructive" : bandwidthPercent > 50 ? "bg-warning" : "bg-info"
                          )}
                          style={{ width: `${bandwidthPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{bandwidthPercent}%</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSite(site)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                    <a 
                      href={`https://${site.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingSite(site)}>
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Configuration
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleSSL(site)}>
                          <Shield className="w-4 h-4 mr-2" />
                          {site.ssl_enabled ? "Disable SSL" : "Enable SSL"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-card rounded-xl p-12 text-center">
            <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery || statusFilter !== "all" ? "No sites found" : "No sites yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "Get started by adding your first site"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <AddSiteDialog>
                <Button className="bg-primary text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Site
                </Button>
              </AddSiteDialog>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingSite && (
        <EditSiteDialog
          site={editingSite}
          open={!!editingSite}
          onOpenChange={(open) => !open && setEditingSite(null)}
        />
      )}
    </div>
  );
};
