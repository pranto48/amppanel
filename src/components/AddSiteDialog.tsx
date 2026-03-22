import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSite } from "@/hooks/useSites";
import { useProvisionSiteService, type RuntimeEnvironment, type VhostTemplateType, type WebServerType } from "@/hooks/useSiteServiceConfig";
import { useToast } from "@/hooks/use-toast";
import { useLogActivity } from "@/hooks/useActivityLogs";
import { Plus, Globe, Loader2 } from "lucide-react";

interface AddSiteDialogProps {
  children?: React.ReactNode;
}

const getDefaultTemplate = (siteType: string): VhostTemplateType => {
  switch (siteType) {
    case "nodejs":
    case "python":
      return "reverse_proxy";
    case "static":
      return "static_site";
    default:
      return "php_fpm";
  }
};

const getDefaultPort = (siteType: string) => (siteType === "nodejs" || siteType === "python" ? "3000" : "");

export const AddSiteDialog = ({ children }: AddSiteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [siteType, setSiteType] = useState<"wordpress" | "nodejs" | "python" | "php" | "static" | "custom">("php");
  const [phpVersion, setPhpVersion] = useState("8.2");
  const [webServer, setWebServer] = useState<WebServerType>("nginx");
  const [template, setTemplate] = useState<VhostTemplateType>("php_fpm");
  const [runtimeEnvironment, setRuntimeEnvironment] = useState<RuntimeEnvironment>("production");
  const [listenPort, setListenPort] = useState("");
  const [proxyTarget, setProxyTarget] = useState("");
  const [customVhostConfig, setCustomVhostConfig] = useState("");
  const createSite = useCreateSite();
  const provisionSiteService = useProvisionSiteService();
  const { toast } = useToast();
  const { logSiteCreated } = useLogActivity();

  const handleSiteTypeChange = (value: typeof siteType) => {
    setSiteType(value);
    setTemplate(getDefaultTemplate(value));
    setListenPort(getDefaultPort(value));
    setProxyTarget(value === "nodejs" || value === "python" ? "http://127.0.0.1:3000" : "");
  };

  const resetForm = () => {
    setDomain("");
    setSiteType("php");
    setPhpVersion("8.2");
    setWebServer("nginx");
    setTemplate("php_fpm");
    setRuntimeEnvironment("production");
    setListenPort("");
    setProxyTarget("");
    setCustomVhostConfig("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!domain.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a domain name.",
      });
      return;
    }

    try {
      const result = await createSite.mutateAsync({
        domain: domain.trim(),
        site_type: siteType,
        php_version: siteType === "php" || siteType === "wordpress" ? phpVersion : null,
      });

      const provisionResult = await provisionSiteService.mutateAsync({
        siteId: result.id,
        config: {
          web_server: webServer,
          template,
          runtime_environment: runtimeEnvironment,
          php_fpm_enabled: template === "php_fpm",
          php_fpm_version: template === "php_fpm" ? phpVersion : null,
          listen_port: listenPort ? Number(listenPort) : null,
          proxy_target: proxyTarget || null,
          custom_vhost_config: customVhostConfig || null,
        },
      });

      logSiteCreated(domain.trim(), result.id);

      toast({
        title: "Site created!",
        description: provisionResult.success
          ? `${domain.trim()} has been added and its service config was generated.`
          : `${domain.trim()} was created, but the generated service config needs attention.`,
      });

      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create site",
        description: error.message || "An error occurred while creating the site.",
      });
    }
  };

  const isPhpTemplate = template === "php_fpm";
  const isProxyTemplate = template === "reverse_proxy";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Site
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Globe className="w-5 h-5 text-primary" />
            Add New Site
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="domain">Domain Name</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteType">Site Type</Label>
              <Select value={siteType} onValueChange={(v) => handleSiteTypeChange(v as typeof siteType)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select site type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="php">PHP</SelectItem>
                  <SelectItem value="wordpress">WordPress</SelectItem>
                  <SelectItem value="nodejs">Node.js</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="static">Static</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Runtime Environment</Label>
              <Select value={runtimeEnvironment} onValueChange={(v) => setRuntimeEnvironment(v as RuntimeEnvironment)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(siteType === "php" || siteType === "wordpress") && (
              <div className="space-y-2">
                <Label htmlFor="phpVersion">PHP Version</Label>
                <Select value={phpVersion} onValueChange={setPhpVersion}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select PHP version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8.3">PHP 8.3</SelectItem>
                    <SelectItem value="8.2">PHP 8.2</SelectItem>
                    <SelectItem value="8.1">PHP 8.1</SelectItem>
                    <SelectItem value="8.0">PHP 8.0</SelectItem>
                    <SelectItem value="7.4">PHP 7.4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Web Server</Label>
              <Select value={webServer} onValueChange={(v) => setWebServer(v as WebServerType)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nginx">Nginx</SelectItem>
                  <SelectItem value="apache">Apache</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={(v) => setTemplate(v as VhostTemplateType)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="php_fpm">PHP-FPM</SelectItem>
                  <SelectItem value="reverse_proxy">Reverse Proxy</SelectItem>
                  <SelectItem value="static_site">Static Site</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isProxyTemplate && (
              <>
                <div className="space-y-2">
                  <Label>Listen Port</Label>
                  <Input
                    type="number"
                    value={listenPort}
                    onChange={(e) => setListenPort(e.target.value)}
                    placeholder="3000"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proxy Target</Label>
                  <Input
                    value={proxyTarget}
                    onChange={(e) => setProxyTarget(e.target.value)}
                    placeholder="http://127.0.0.1:3000"
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}
          </div>

          {(template === "custom" || isPhpTemplate || isProxyTemplate) && (
            <div className="space-y-2">
              <Label>Extra VHost Directives</Label>
              <Textarea
                value={customVhostConfig}
                onChange={(e) => setCustomVhostConfig(e.target.value)}
                placeholder={webServer === "nginx" ? "location /health { return 200; }" : "Header set X-Frame-Options SAMEORIGIN"}
                className="bg-secondary border-border font-mono text-xs min-h-28"
              />
            </div>
          )}

          <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            AMP Panel will generate the virtual host, PHP-FPM pool, and per-site runtime configuration for this site before deployment.
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSite.isPending || provisionSiteService.isPending}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {createSite.isPending || provisionSiteService.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Site"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
