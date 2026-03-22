import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateSite } from "@/hooks/useSites";
import {
  useDeploySiteService,
  usePreviewSiteService,
  useRollbackSiteService,
  useSiteServiceConfig,
  useSiteServiceDeployments,
  useSiteServiceLogs,
  useTestSiteService,
  type RuntimeEnvironment,
  type SiteServiceConfigInput,
  type VhostTemplateType,
  type WebServerType,
} from "@/hooks/useSiteServiceConfig";
import { useToast } from "@/hooks/use-toast";
import { useLogActivity } from "@/hooks/useActivityLogs";
import { Settings, Loader2, Shield, Server, RotateCcw, FileCode2, Rocket, FileSearch, ScrollText } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Site = Tables<"sites">;

interface EditSiteDialogProps {
  site: Site;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const inferTemplate = (siteType: Site["site_type"]): VhostTemplateType => {
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

const defaultPort = (siteType: Site["site_type"]) => (siteType === "nodejs" || siteType === "python" ? 3000 : null);

export const EditSiteDialog = ({ site, open, onOpenChange }: EditSiteDialogProps) => {
  const [phpVersion, setPhpVersion] = useState(site.php_version || "8.2");
  const [sslEnabled, setSslEnabled] = useState(site.ssl_enabled);
  const [storageLimit, setStorageLimit] = useState(site.storage_limit_mb.toString());
  const [bandwidthLimit, setBandwidthLimit] = useState(site.bandwidth_limit_gb.toString());
  const [documentRoot, setDocumentRoot] = useState(site.document_root || "/var/www/html");
  const [status, setStatus] = useState<"active" | "pending" | "suspended" | "error">(site.status);
  const [webServer, setWebServer] = useState<WebServerType>("nginx");
  const [template, setTemplate] = useState<VhostTemplateType>(inferTemplate(site.site_type));
  const [runtimeEnvironment, setRuntimeEnvironment] = useState<RuntimeEnvironment>("production");
  const [phpFpmEnabled, setPhpFpmEnabled] = useState(site.site_type === "php" || site.site_type === "wordpress");
  const [phpFpmPoolName, setPhpFpmPoolName] = useState(site.domain.replace(/[^a-z0-9]+/gi, "_").toLowerCase());
  const [phpPm, setPhpPm] = useState("dynamic");
  const [maxChildren, setMaxChildren] = useState("10");
  const [startServers, setStartServers] = useState("2");
  const [minSpareServers, setMinSpareServers] = useState("1");
  const [maxSpareServers, setMaxSpareServers] = useState("3");
  const [maxRequests, setMaxRequests] = useState("500");
  const [listenPort, setListenPort] = useState(defaultPort(site.site_type)?.toString() || "");
  const [proxyTarget, setProxyTarget] = useState(site.site_type === "nodejs" || site.site_type === "python" ? "http://127.0.0.1:3000" : "");
  const [customVhostConfig, setCustomVhostConfig] = useState("");
  const [runtimeConfigText, setRuntimeConfigText] = useState('{\n  "memory_limit": "256M"\n}');
  const [envVarsText, setEnvVarsText] = useState('{\n  "APP_ENV": "production"\n}');
  const [phpIniOverridesText, setPhpIniOverridesText] = useState('{\n  "memory_limit": "256M",\n  "upload_max_filesize": "64M"\n}');
  const [accessLogPath, setAccessLogPath] = useState("");
  const [errorLogPath, setErrorLogPath] = useState("");
  const [previewOutput, setPreviewOutput] = useState<string | null>(null);
  const [generatedVhostConfig, setGeneratedVhostConfig] = useState<string | null>(null);
  const [generatedPoolConfig, setGeneratedPoolConfig] = useState<string | null>(null);

  const updateSite = useUpdateSite();
  const { data: serviceConfig } = useSiteServiceConfig(site.id);
  const { data: deployments = [] } = useSiteServiceDeployments(site.id);
  const { data: accessLogs = [] } = useSiteServiceLogs(site.id, "access");
  const { data: errorLogs = [] } = useSiteServiceLogs(site.id, "error");
  const previewService = usePreviewSiteService();
  const testService = useTestSiteService();
  const deployService = useDeploySiteService();
  const rollbackService = useRollbackSiteService();
  const { toast } = useToast();
  const { logSiteUpdated } = useLogActivity();

  useEffect(() => {
    if (!serviceConfig) return;
    setWebServer(serviceConfig.web_server);
    setTemplate(serviceConfig.template);
    setRuntimeEnvironment(serviceConfig.runtime_environment);
    setPhpFpmEnabled(serviceConfig.php_fpm_enabled);
    setPhpVersion(serviceConfig.php_fpm_version || site.php_version || "8.2");
    setPhpFpmPoolName(serviceConfig.php_fpm_pool_name);
    setPhpPm(serviceConfig.php_fpm_pm);
    setMaxChildren(serviceConfig.php_fpm_max_children.toString());
    setStartServers(serviceConfig.php_fpm_start_servers.toString());
    setMinSpareServers(serviceConfig.php_fpm_min_spare_servers.toString());
    setMaxSpareServers(serviceConfig.php_fpm_max_spare_servers.toString());
    setMaxRequests(serviceConfig.php_fpm_max_requests.toString());
    setListenPort(serviceConfig.listen_port?.toString() || "");
    setProxyTarget(serviceConfig.proxy_target || "");
    setCustomVhostConfig(serviceConfig.custom_vhost_config || "");
    setRuntimeConfigText(JSON.stringify(serviceConfig.custom_runtime_config || {}, null, 2));
    setEnvVarsText(JSON.stringify(serviceConfig.env_vars || {}, null, 2));
    setPhpIniOverridesText(JSON.stringify(serviceConfig.php_ini_overrides || {}, null, 2));
    setAccessLogPath(serviceConfig.access_log_path || "");
    setErrorLogPath(serviceConfig.error_log_path || "");
    setPreviewOutput(serviceConfig.last_test_output || serviceConfig.last_validation_output);
    setGeneratedVhostConfig(serviceConfig.generated_vhost_config);
    setGeneratedPoolConfig(serviceConfig.generated_pool_config);
  }, [serviceConfig, site.php_version]);

  const latestDeployableSnapshot = useMemo(
    () => deployments.find((deployment) => deployment.action === "deploy" && deployment.status === "deployed"),
    [deployments],
  );

  const parseJsonText = (value: string, label: string) => {
    if (!value.trim()) return {};
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      throw new Error(`${label} must be valid JSON.`);
    }
  };

  const buildServicePayload = (): SiteServiceConfigInput => ({
    web_server: webServer,
    template,
    runtime_environment: runtimeEnvironment,
    php_fpm_enabled: phpFpmEnabled,
    php_fpm_version: phpFpmEnabled ? phpVersion : null,
    php_fpm_pool_name: phpFpmEnabled ? phpFpmPoolName : null,
    php_fpm_pm: phpPm,
    php_fpm_max_children: Number(maxChildren),
    php_fpm_start_servers: Number(startServers),
    php_fpm_min_spare_servers: Number(minSpareServers),
    php_fpm_max_spare_servers: Number(maxSpareServers),
    php_fpm_max_requests: Number(maxRequests),
    listen_port: listenPort ? Number(listenPort) : null,
    proxy_target: proxyTarget || null,
    custom_vhost_config: customVhostConfig || null,
    custom_runtime_config: parseJsonText(runtimeConfigText, "Runtime config"),
    env_vars: parseJsonText(envVarsText, "Environment variables"),
    php_ini_overrides: parseJsonText(phpIniOverridesText, "php.ini overrides"),
    access_log_path: accessLogPath || null,
    error_log_path: errorLogPath || null,
  });

  const handlePreview = async () => {
    try {
      const result = await previewService.mutateAsync({ siteId: site.id, config: buildServicePayload() });
      setPreviewOutput(result.validation_output);
      setGeneratedVhostConfig(result.generated_vhost_config);
      setGeneratedPoolConfig(result.generated_pool_config);
      toast({ title: "Config preview ready", description: "Generated web server and PHP-FPM config files were refreshed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Preview failed", description: error.message || "Preview could not be generated." });
    }
  };

  const handleTestConfig = async () => {
    try {
      const result = await testService.mutateAsync({ siteId: site.id, config: buildServicePayload() });
      setPreviewOutput(result.validation_output);
      setGeneratedVhostConfig(result.generated_vhost_config);
      setGeneratedPoolConfig(result.generated_pool_config);
      toast({ title: "Config test passed", description: "The generated service config passed the simulated pre-apply test." });
    } catch (error: any) {
      setPreviewOutput(error.message || "Config test failed.");
      toast({ variant: "destructive", title: "Config test failed", description: error.message || "Fix the generated config before deploying." });
    }
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();

    const changes = {
      php_version: phpVersion !== site.php_version ? phpVersion : undefined,
      ssl_enabled: sslEnabled !== site.ssl_enabled ? sslEnabled : undefined,
      storage_limit_mb: parseInt(storageLimit) !== site.storage_limit_mb ? parseInt(storageLimit) : undefined,
      bandwidth_limit_gb: parseInt(bandwidthLimit) !== site.bandwidth_limit_gb ? parseInt(bandwidthLimit) : undefined,
      document_root: documentRoot !== site.document_root ? documentRoot : undefined,
      status: status !== site.status ? status : undefined,
    };
    const actualChanges = Object.fromEntries(Object.entries(changes).filter(([_, v]) => v !== undefined));

    try {
      const payload = buildServicePayload();
      await updateSite.mutateAsync({
        id: site.id,
        php_version: phpVersion,
        ssl_enabled: sslEnabled,
        storage_limit_mb: parseInt(storageLimit) || 5000,
        bandwidth_limit_gb: parseInt(bandwidthLimit) || 100,
        document_root: documentRoot,
        status,
      });

      const deployResult = await deployService.mutateAsync({ siteId: site.id, config: payload });
      setPreviewOutput([deployResult.validation_output, deployResult.orchestration_log].filter(Boolean).join("\n\n"));
      setGeneratedVhostConfig(deployResult.generated_vhost_config);
      setGeneratedPoolConfig(deployResult.generated_pool_config);

      if (Object.keys(actualChanges).length > 0) logSiteUpdated(site.domain, site.id, actualChanges);
      logSiteUpdated(site.domain, site.id, {
        web_server: webServer,
        template,
        runtime_environment: runtimeEnvironment,
        php_version: phpVersion,
        php_fpm_pool_name: phpFpmPoolName,
      });

      toast({ title: "Site updated and deployed", description: `${site.domain} passed testing, switched to PHP ${phpVersion}, and applied the generated service config.` });
      onOpenChange(false);
    } catch (error: any) {
      setPreviewOutput(error.message || "Deployment failed.");
      toast({ variant: "destructive", title: "Deployment failed", description: error.message || "Deployment failed; AMP Panel attempted to roll back automatically." });
    }
  };

  const handleRollback = async () => {
    if (!latestDeployableSnapshot) return;
    try {
      const result = await rollbackService.mutateAsync({ siteId: site.id, deploymentId: latestDeployableSnapshot.id });
      setPreviewOutput(result.deployment?.validation_output || "Rollback completed.");
      toast({ title: "Rollback completed", description: `Restored the last deployed service snapshot for ${site.domain}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Rollback failed", description: error.message || "Unable to restore the previous deployment." });
    }
  };

  const isPhpSite = site.site_type === "php" || site.site_type === "wordpress";
  const isProxyTemplate = template === "reverse_proxy";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="w-5 h-5 text-primary" />
            Configure {site.domain}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleDeploy} className="space-y-6 mt-4">
          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Site Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Runtime Environment</Label>
                  <Select value={runtimeEnvironment} onValueChange={(v) => setRuntimeEnvironment(v as RuntimeEnvironment)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isPhpSite && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Server className="w-4 h-4 text-muted-foreground" />PHP Version</Label>
                    <Select value={phpVersion} onValueChange={setPhpVersion}>
                      <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8.3">PHP 8.3 (Latest)</SelectItem>
                        <SelectItem value="8.2">PHP 8.2 (Recommended)</SelectItem>
                        <SelectItem value="8.1">PHP 8.1</SelectItem>
                        <SelectItem value="8.0">PHP 8.0</SelectItem>
                        <SelectItem value="7.4">PHP 7.4 (Legacy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>PHP-FPM Pool</Label>
                    <Input value={phpFpmPoolName} onChange={(e) => setPhpFpmPoolName(e.target.value)} className="bg-secondary border-border font-mono text-sm" />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground" />SSL Certificate</Label>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Enable SSL/HTTPS</p>
                    <p className="text-xs text-muted-foreground">{sslEnabled ? "Let's Encrypt certificate active" : "No SSL certificate installed"}</p>
                  </div>
                  <Switch checked={sslEnabled} onCheckedChange={setSslEnabled} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Document Root</Label>
                  <Input value={documentRoot} onChange={(e) => setDocumentRoot(e.target.value)} className="bg-secondary border-border font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Web Server</Label>
                  <Select value={webServer} onValueChange={(v) => setWebServer(v as WebServerType)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nginx">Nginx</SelectItem>
                      <SelectItem value="apache">Apache</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select value={template} onValueChange={(v) => setTemplate(v as VhostTemplateType)}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="php_fpm">PHP-FPM</SelectItem>
                      <SelectItem value="reverse_proxy">Reverse Proxy</SelectItem>
                      <SelectItem value="static_site">Static Site</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center justify-between"><span>Enable PHP-FPM Pool</span><Switch checked={phpFpmEnabled} onCheckedChange={setPhpFpmEnabled} /></Label>
                  <p className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">Switch PHP versions per site and tune the pool independently of other sites.</p>
                </div>
              </div>

              {phpFpmEnabled && (
                <div className="rounded-xl border border-border p-4 space-y-4">
                  <div className="grid md:grid-cols-5 gap-3">
                    <div className="space-y-2"><Label>Max Children</Label><Input type="number" value={maxChildren} onChange={(e) => setMaxChildren(e.target.value)} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Start</Label><Input type="number" value={startServers} onChange={(e) => setStartServers(e.target.value)} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Min Spare</Label><Input type="number" value={minSpareServers} onChange={(e) => setMinSpareServers(e.target.value)} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Max Spare</Label><Input type="number" value={maxSpareServers} onChange={(e) => setMaxSpareServers(e.target.value)} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Max Requests</Label><Input type="number" value={maxRequests} onChange={(e) => setMaxRequests(e.target.value)} className="bg-secondary border-border" /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>php.ini Overrides (JSON)</Label>
                    <Textarea value={phpIniOverridesText} onChange={(e) => setPhpIniOverridesText(e.target.value)} className="bg-secondary border-border font-mono text-xs min-h-28" />
                  </div>
                </div>
              )}

              {isProxyTemplate && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Listen Port</Label><Input type="number" value={listenPort} onChange={(e) => setListenPort(e.target.value)} className="bg-secondary border-border" /></div>
                  <div className="space-y-2"><Label>Proxy Target</Label><Input value={proxyTarget} onChange={(e) => setProxyTarget(e.target.value)} className="bg-secondary border-border font-mono text-sm" /></div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Custom Runtime Config (JSON)</Label><Textarea value={runtimeConfigText} onChange={(e) => setRuntimeConfigText(e.target.value)} className="bg-secondary border-border font-mono text-xs min-h-28" /></div>
                <div className="space-y-2"><Label>Environment Variables (JSON)</Label><Textarea value={envVarsText} onChange={(e) => setEnvVarsText(e.target.value)} className="bg-secondary border-border font-mono text-xs min-h-28" /></div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Access Log Path</Label><Input value={accessLogPath} onChange={(e) => setAccessLogPath(e.target.value)} className="bg-secondary border-border font-mono text-sm" /></div>
                <div className="space-y-2"><Label>Error Log Path</Label><Input value={errorLogPath} onChange={(e) => setErrorLogPath(e.target.value)} className="bg-secondary border-border font-mono text-sm" /></div>
              </div>

              <div className="space-y-2">
                <Label>Extra VHost Directives</Label>
                <Textarea value={customVhostConfig} onChange={(e) => setCustomVhostConfig(e.target.value)} className="bg-secondary border-border font-mono text-xs min-h-28" placeholder={webServer === "nginx" ? "location /health { return 200; }" : "Header set X-Frame-Options SAMEORIGIN"} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Storage Limit (MB)</Label><Input type="number" value={storageLimit} onChange={(e) => setStorageLimit(e.target.value)} className="bg-secondary border-border" /></div>
                <div className="space-y-2"><Label>Bandwidth Limit (GB)</Label><Input type="number" value={bandwidthLimit} onChange={(e) => setBandwidthLimit(e.target.value)} className="bg-secondary border-border" /></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-foreground font-medium"><FileCode2 className="w-4 h-4 text-primary" />Validation & Deployment</div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handlePreview} disabled={previewService.isPending}>{previewService.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCode2 className="w-4 h-4 mr-2" />}Preview</Button>
                  <Button type="button" variant="outline" onClick={handleTestConfig} disabled={testService.isPending}>{testService.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSearch className="w-4 h-4 mr-2" />}Test Config</Button>
                  <Button type="submit" disabled={updateSite.isPending || deployService.isPending}>{updateSite.isPending || deployService.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Rocket className="w-4 h-4 mr-2" />}Deploy</Button>
                  <Button type="button" variant="secondary" disabled={!latestDeployableSnapshot || rollbackService.isPending} onClick={handleRollback}>{rollbackService.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}Rollback</Button>
                </div>
                <p className="text-xs text-muted-foreground">Test Config runs the pre-apply config test first. If Deploy fails after generation, AMP Panel records the failed deployment and attempts an automatic rollback to the previous deployed snapshot.</p>
                {serviceConfig?.last_deployment_status && <p className="text-xs font-medium text-foreground">Current status: <span className="capitalize">{serviceConfig.last_deployment_status.replace(/_/g, " ")}</span></p>}
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Validation / Test Output</h4>
                <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground min-h-32 overflow-auto">{previewOutput || "Run Preview or Test Config to validate the generated configuration."}</pre>
              </div>

              <Separator />

              <Tabs defaultValue="generated" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="generated">Generated Config</TabsTrigger>
                  <TabsTrigger value="logs">Site Logs</TabsTrigger>
                </TabsList>
                <TabsContent value="generated" className="space-y-3 mt-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Generated VHost</h4>
                    <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground min-h-40 overflow-auto">{generatedVhostConfig || "No vhost generated yet."}</pre>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Generated PHP-FPM Pool</h4>
                    <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground min-h-32 overflow-auto">{generatedPoolConfig || "PHP-FPM is disabled for this template."}</pre>
                  </div>
                </TabsContent>
                <TabsContent value="logs" className="space-y-4 mt-4">
                  <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 mb-2"><ScrollText className="w-4 h-4" />Per-site access and error logs</div>
                    <p>Access: {accessLogPath || serviceConfig?.access_log_path || "Not configured"}</p>
                    <p>Error: {errorLogPath || serviceConfig?.error_log_path || "Not configured"}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Recent Access Log Lines</h4>
                    <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground min-h-28 overflow-auto">{accessLogs.length ? accessLogs.map((log) => log.message).join("\n") : "No access log lines captured yet."}</pre>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Recent Error Log Lines</h4>
                    <pre className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-xs text-muted-foreground min-h-28 overflow-auto">{errorLogs.length ? errorLogs.map((log) => log.message).join("\n") : "No error log lines captured yet."}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
