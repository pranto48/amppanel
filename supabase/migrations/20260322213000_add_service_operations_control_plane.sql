CREATE TYPE public.service_runtime_status AS ENUM ('running', 'stopped', 'restarting', 'failed');
CREATE TYPE public.service_control_action AS ENUM ('start', 'stop', 'restart', 'config_test', 'package_update', 'maintenance');

CREATE TABLE public.system_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status public.service_runtime_status NOT NULL DEFAULT 'running',
  version TEXT,
  memory_usage_mb NUMERIC NOT NULL DEFAULT 0,
  config_test_command TEXT,
  last_config_test_passed BOOLEAN,
  last_config_test_output TEXT,
  dependency_graph JSONB NOT NULL DEFAULT '[]'::jsonb,
  resource_limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.service_control_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.system_services(id) ON DELETE CASCADE,
  action public.service_control_action NOT NULL,
  status public.service_runtime_status NOT NULL DEFAULT 'running',
  config_test_passed BOOLEAN,
  output TEXT,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.service_package_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.system_services(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  current_version TEXT NOT NULL,
  target_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  summary TEXT,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ
);

CREATE TABLE public.service_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.system_services(id) ON DELETE CASCADE,
  unit TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.service_maintenance_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.system_services(id) ON DELETE CASCADE,
  action_name TEXT NOT NULL,
  action public.service_control_action NOT NULL DEFAULT 'maintenance',
  cron_expression TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_control_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_package_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_maintenance_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view system services"
ON public.system_services FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage system services"
ON public.system_services FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view service control runs"
ON public.service_control_runs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.system_services s WHERE s.id = service_id AND (s.site_id IS NULL OR public.has_site_access(auth.uid(), s.site_id) OR public.is_admin(auth.uid()))));
CREATE POLICY "Admins can manage service control runs"
ON public.service_control_runs FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view service package updates"
ON public.service_package_updates FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.system_services s WHERE s.id = service_id AND (s.site_id IS NULL OR public.has_site_access(auth.uid(), s.site_id) OR public.is_admin(auth.uid()))));
CREATE POLICY "Admins can manage service package updates"
ON public.service_package_updates FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view service journal entries"
ON public.service_journal_entries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.system_services s WHERE s.id = service_id AND (s.site_id IS NULL OR public.has_site_access(auth.uid(), s.site_id) OR public.is_admin(auth.uid()))));
CREATE POLICY "Admins can manage service journal entries"
ON public.service_journal_entries FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view maintenance actions"
ON public.service_maintenance_actions FOR SELECT TO authenticated USING (service_id IS NULL OR EXISTS (SELECT 1 FROM public.system_services s WHERE s.id = service_id AND (s.site_id IS NULL OR public.has_site_access(auth.uid(), s.site_id) OR public.is_admin(auth.uid()))));
CREATE POLICY "Admins can manage maintenance actions"
ON public.service_maintenance_actions FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_system_services_updated_at BEFORE UPDATE ON public.system_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_maintenance_actions_updated_at BEFORE UPDATE ON public.service_maintenance_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_services (service_name, display_name, status, version, memory_usage_mb, config_test_command, last_config_test_passed, last_config_test_output, dependency_graph, resource_limits)
VALUES
  ('nginx', 'Nginx', 'running', '1.24.0', 124, 'nginx -t', true, 'syntax is ok', '["php-fpm"]'::jsonb, '{"cpu_quota":"50%","memory_max":"512M"}'::jsonb),
  ('mysql', 'MySQL', 'running', '8.0.35', 512, 'mysqladmin ping', true, 'mysqld is alive', '["redis"]'::jsonb, '{"cpu_quota":"60%","memory_max":"2G"}'::jsonb),
  ('php-fpm', 'PHP-FPM', 'running', '8.2.12', 256, 'php-fpm -t', true, 'configuration file test is successful', '["redis"]'::jsonb, '{"cpu_quota":"40%","memory_max":"1G"}'::jsonb),
  ('redis', 'Redis', 'running', '7.2.3', 64, 'redis-cli ping', true, 'PONG', '[]'::jsonb, '{"cpu_quota":"20%","memory_max":"256M"}'::jsonb),
  ('postfix', 'Postfix', 'stopped', '3.7.6', 0, 'postfix check', false, 'service inactive', '["dovecot"]'::jsonb, '{"cpu_quota":"20%","memory_max":"256M"}'::jsonb)
ON CONFLICT (service_name) DO NOTHING;
