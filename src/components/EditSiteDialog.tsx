import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpdateSite } from "@/hooks/useSites";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, Shield, Server } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Site = Tables<"sites">;

interface EditSiteDialogProps {
  site: Site;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditSiteDialog = ({ site, open, onOpenChange }: EditSiteDialogProps) => {
  const [phpVersion, setPhpVersion] = useState(site.php_version || "8.2");
  const [sslEnabled, setSslEnabled] = useState(site.ssl_enabled);
  const [storageLimit, setStorageLimit] = useState(site.storage_limit_mb.toString());
  const [bandwidthLimit, setBandwidthLimit] = useState(site.bandwidth_limit_gb.toString());
  const [documentRoot, setDocumentRoot] = useState(site.document_root || "/var/www/html");
  const [status, setStatus] = useState<"active" | "pending" | "suspended" | "error">(site.status);
  
  const updateSite = useUpdateSite();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateSite.mutateAsync({
        id: site.id,
        php_version: phpVersion,
        ssl_enabled: sslEnabled,
        storage_limit_mb: parseInt(storageLimit) || 5000,
        bandwidth_limit_gb: parseInt(bandwidthLimit) || 100,
        document_root: documentRoot,
        status: status,
      });

      toast({
        title: "Site updated!",
        description: `${site.domain} configuration has been saved.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to update site",
        description: error.message || "An error occurred while updating the site.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="w-5 h-5 text-primary" />
            Configure {site.domain}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Status */}
          <div className="space-y-2">
            <Label>Site Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PHP Version */}
          {(site.site_type === "php" || site.site_type === "wordpress") && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Server className="w-4 h-4 text-muted-foreground" />
                PHP Version
              </Label>
              <Select value={phpVersion} onValueChange={setPhpVersion}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8.3">PHP 8.3 (Latest)</SelectItem>
                  <SelectItem value="8.2">PHP 8.2 (Recommended)</SelectItem>
                  <SelectItem value="8.1">PHP 8.1</SelectItem>
                  <SelectItem value="8.0">PHP 8.0</SelectItem>
                  <SelectItem value="7.4">PHP 7.4 (Legacy)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* SSL Certificate */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              SSL Certificate
            </Label>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Enable SSL/HTTPS</p>
                <p className="text-xs text-muted-foreground">
                  {sslEnabled ? "Let's Encrypt certificate active" : "No SSL certificate installed"}
                </p>
              </div>
              <Switch
                checked={sslEnabled}
                onCheckedChange={setSslEnabled}
              />
            </div>
            {sslEnabled && (
              <p className="text-xs text-success flex items-center gap-1">
                <Shield className="w-3 h-3" />
                SSL certificate will be automatically provisioned
              </p>
            )}
          </div>

          {/* Document Root */}
          <div className="space-y-2">
            <Label>Document Root</Label>
            <Input
              value={documentRoot}
              onChange={(e) => setDocumentRoot(e.target.value)}
              placeholder="/var/www/html"
              className="bg-secondary border-border font-mono text-sm"
            />
          </div>

          {/* Resource Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Storage Limit (MB)</Label>
              <Input
                type="number"
                value={storageLimit}
                onChange={(e) => setStorageLimit(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Bandwidth Limit (GB)</Label>
              <Input
                type="number"
                value={bandwidthLimit}
                onChange={(e) => setBandwidthLimit(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateSite.isPending}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {updateSite.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
