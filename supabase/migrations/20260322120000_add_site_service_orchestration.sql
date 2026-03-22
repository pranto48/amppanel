-- Web service orchestration enums
CREATE TYPE public.web_server_type AS ENUM ('nginx', 'apache');
CREATE TYPE public.vhost_template_type AS ENUM ('php_fpm', 'reverse_proxy', 'static_site', 'custom');
CREATE TYPE public.runtime_environment AS ENUM ('production', 'staging', 'development');
CREATE TYPE public.service_deployment_status AS ENUM ('pending', 'validated', 'deployed', 'failed', 'rolled_back');
CREATE TYPE public.service_action_type AS ENUM ('provision', 'deploy', 'rollback');

-- Per-site service configuration
CREATE TABLE public.site_service_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL UNIQUE REFERENCES public.sites(id) ON DELETE CASCADE,
  web_server public.web_server_type NOT NULL DEFAULT 'nginx',
  template public.vhost_template_type NOT NULL DEFAULT 'php_fpm',
  runtime_environment public.runtime_environment NOT NULL DEFAULT 'production',
  php_fpm_enabled BOOLEAN NOT NULL DEFAULT true,
  php_fpm_version TEXT,
  php_fpm_pool_name TEXT NOT NULL,
  php_fpm_pm TEXT NOT NULL DEFAULT 'dynamic',
  php_fpm_max_children INTEGER NOT NULL DEFAULT 10,
  php_fpm_start_servers INTEGER NOT NULL DEFAULT 2,
  php_fpm_min_spare_servers INTEGER NOT NULL DEFAULT 1,
  php_fpm_max_spare_servers INTEGER NOT NULL DEFAULT 3,
  php_fpm_max_requests INTEGER NOT NULL DEFAULT 500,
  listen_port INTEGER,
  proxy_target TEXT,
  custom_vhost_config TEXT,
  custom_runtime_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  env_vars JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_vhost_config TEXT,
  generated_pool_config TEXT,
  last_validation_output TEXT,
  last_applied_at TIMESTAMPTZ,
  last_deployment_status public.service_deployment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_service_configs_php_pool_name_key UNIQUE (php_fpm_pool_name),
  CONSTRAINT site_service_configs_proxy_target_check CHECK (
    template <> 'reverse_proxy' OR proxy_target IS NOT NULL
  ),
  CONSTRAINT site_service_configs_listen_port_check CHECK (
    listen_port IS NULL OR (listen_port >= 1 AND listen_port <= 65535)
  )
);

-- Deployment history and rollback snapshots
CREATE TABLE public.site_service_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES public.site_service_configs(id) ON DELETE CASCADE,
  action public.service_action_type NOT NULL,
  status public.service_deployment_status NOT NULL DEFAULT 'pending',
  validation_output TEXT,
  orchestration_log TEXT,
  snapshot_vhost_config TEXT,
  snapshot_pool_config TEXT,
  applied_vhost_config TEXT,
  applied_pool_config TEXT,
  rollback_source_deployment_id UUID REFERENCES public.site_service_deployments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_service_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_service_deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service configs of their sites"
ON public.site_service_configs FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can manage service configs"
ON public.site_service_configs FOR ALL
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Users can view service deployments of their sites"
ON public.site_service_deployments FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can create service deployments"
ON public.site_service_deployments FOR INSERT
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE TRIGGER update_site_service_configs_updated_at
BEFORE UPDATE ON public.site_service_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
