import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WebServerType = "nginx" | "apache";
export type VhostTemplateType = "php_fpm" | "reverse_proxy" | "static_site" | "custom";
export type RuntimeEnvironment = "production" | "staging" | "development";
export type DeploymentStatus = "pending" | "validated" | "deployed" | "failed" | "rolled_back";

export interface SiteServiceConfig {
  id: string;
  site_id: string;
  web_server: WebServerType;
  template: VhostTemplateType;
  runtime_environment: RuntimeEnvironment;
  php_fpm_enabled: boolean;
  php_fpm_version: string | null;
  php_fpm_pool_name: string;
  php_fpm_pm: string;
  php_fpm_max_children: number;
  php_fpm_start_servers: number;
  php_fpm_min_spare_servers: number;
  php_fpm_max_spare_servers: number;
  php_fpm_max_requests: number;
  listen_port: number | null;
  proxy_target: string | null;
  custom_vhost_config: string | null;
  custom_runtime_config: Record<string, unknown>;
  env_vars: Record<string, unknown>;
  generated_vhost_config: string | null;
  generated_pool_config: string | null;
  last_validation_output: string | null;
  last_applied_at: string | null;
  last_deployment_status: DeploymentStatus;
  created_at: string;
  updated_at: string;
}

export interface SiteServiceDeployment {
  id: string;
  site_id: string;
  config_id: string;
  action: "provision" | "deploy" | "rollback";
  status: DeploymentStatus;
  validation_output: string | null;
  orchestration_log: string | null;
  snapshot_vhost_config: string | null;
  snapshot_pool_config: string | null;
  applied_vhost_config: string | null;
  applied_pool_config: string | null;
  rollback_source_deployment_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SiteServiceConfigInput {
  web_server: WebServerType;
  template: VhostTemplateType;
  runtime_environment: RuntimeEnvironment;
  php_fpm_enabled: boolean;
  php_fpm_version?: string | null;
  php_fpm_pool_name?: string | null;
  php_fpm_pm?: string | null;
  php_fpm_max_children?: number | null;
  php_fpm_start_servers?: number | null;
  php_fpm_min_spare_servers?: number | null;
  php_fpm_max_spare_servers?: number | null;
  php_fpm_max_requests?: number | null;
  listen_port?: number | null;
  proxy_target?: string | null;
  custom_vhost_config?: string | null;
  custom_runtime_config?: Record<string, unknown>;
  env_vars?: Record<string, unknown>;
}

export interface OrchestratorResponse {
  success: boolean;
  validation_output: string;
  generated_vhost_config: string;
  generated_pool_config: string | null;
  runtime_config: string;
  orchestration_log?: string;
  config: SiteServiceConfig;
  deployment?: SiteServiceDeployment;
}

export function useSiteServiceConfig(siteId: string) {
  return useQuery({
    queryKey: ["site-service-config", siteId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_service_configs")
        .select("*")
        .eq("site_id", siteId)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as SiteServiceConfig | null;
    },
    enabled: !!siteId,
  });
}

export function useSiteServiceDeployments(siteId: string) {
  return useQuery({
    queryKey: ["site-service-deployments", siteId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_service_deployments")
        .select("*")
        .eq("site_id", siteId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data ?? []) as SiteServiceDeployment[];
    },
    enabled: !!siteId,
  });
}

function createOrchestratorMutation(action: "provision" | "preview" | "deploy" | "rollback") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ siteId, config, deploymentId }: { siteId: string; config?: SiteServiceConfigInput; deploymentId?: string }) => {
      const { data, error } = await supabase.functions.invoke("site-orchestrator", {
        body: {
          action,
          site_id: siteId,
          config,
          deployment_id: deploymentId,
        },
      });

      if (error) throw error;
      return data as OrchestratorResponse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["site-service-config", variables.siteId] });
      queryClient.invalidateQueries({ queryKey: ["site-service-deployments", variables.siteId] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export function useProvisionSiteService() {
  return createOrchestratorMutation("provision");
}

export function usePreviewSiteService() {
  return createOrchestratorMutation("preview");
}

export function useDeploySiteService() {
  return createOrchestratorMutation("deploy");
}

export function useRollbackSiteService() {
  return createOrchestratorMutation("rollback");
}
