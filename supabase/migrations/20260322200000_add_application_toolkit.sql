CREATE TYPE public.app_template_runtime AS ENUM ('php', 'nodejs', 'python', 'wordpress', 'static');
CREATE TYPE public.app_install_status AS ENUM ('draft', 'installed', 'syncing', 'failed');
CREATE TYPE public.package_action_type AS ENUM ('composer_install', 'npm_install', 'pip_install', 'composer_update', 'npm_build', 'pip_freeze');

CREATE TABLE public.app_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  runtime public.app_template_runtime NOT NULL,
  description TEXT,
  document_root_suffix TEXT NOT NULL DEFAULT '/public',
  startup_command TEXT,
  package_actions public.package_action_type[] NOT NULL DEFAULT '{}',
  env_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_app_installations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL UNIQUE REFERENCES public.sites(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.app_templates(id) ON DELETE SET NULL,
  app_name TEXT NOT NULL,
  runtime public.app_template_runtime NOT NULL,
  runtime_version TEXT,
  install_status public.app_install_status NOT NULL DEFAULT 'draft',
  repository_url TEXT,
  branch TEXT NOT NULL DEFAULT 'main',
  staging_site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  production_sync_notes TEXT,
  runtime_detection JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_deploy_hooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  hook_type TEXT NOT NULL DEFAULT 'post_receive',
  repository_url TEXT,
  branch TEXT NOT NULL DEFAULT 'main',
  deploy_script TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_environment_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_secret BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, key)
);

CREATE TABLE public.site_package_action_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  action public.package_action_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_app_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_deploy_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_environment_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_package_action_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view app templates" ON public.app_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage app templates" ON public.app_templates FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view site app installations" ON public.site_app_installations FOR SELECT TO authenticated USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage site app installations" ON public.site_app_installations FOR ALL USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid())) WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view site deploy hooks" ON public.site_deploy_hooks FOR SELECT TO authenticated USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage site deploy hooks" ON public.site_deploy_hooks FOR ALL USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid())) WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view site env vars" ON public.site_environment_variables FOR SELECT TO authenticated USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage site env vars" ON public.site_environment_variables FOR ALL USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid())) WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view site package action runs" ON public.site_package_action_runs FOR SELECT TO authenticated USING (public.has_site_access(auth.uid(), site_id));
CREATE POLICY "Owners and admins can manage site package action runs" ON public.site_package_action_runs FOR ALL USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid())) WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()));

CREATE TRIGGER update_app_templates_updated_at BEFORE UPDATE ON public.app_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_app_installations_updated_at BEFORE UPDATE ON public.site_app_installations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_deploy_hooks_updated_at BEFORE UPDATE ON public.site_deploy_hooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_environment_variables_updated_at BEFORE UPDATE ON public.site_environment_variables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_templates (name, runtime, description, document_root_suffix, startup_command, package_actions, env_defaults)
VALUES
  ('WordPress Starter', 'wordpress', 'One-click WordPress install with wp-config and uploads-ready layout.', '/public', 'php-fpm', ARRAY['composer_install']::public.package_action_type[], '{"WP_ENV":"production","WP_DEBUG":"false"}'::jsonb),
  ('Node API', 'nodejs', 'Express/Fastify style Node.js service template.', '/app', 'npm run start', ARRAY['npm_install','npm_build']::public.package_action_type[], '{"NODE_ENV":"production","PORT":"3000"}'::jsonb),
  ('Python App', 'python', 'Gunicorn/Uvicorn oriented Python web app.', '/app', 'pip install -r requirements.txt && python app.py', ARRAY['pip_install']::public.package_action_type[], '{"PYTHONUNBUFFERED":"1"}'::jsonb)
ON CONFLICT (name) DO NOTHING;
