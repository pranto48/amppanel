CREATE TYPE public.health_status AS ENUM ('healthy', 'warning', 'critical', 'unknown');
CREATE TYPE public.monitoring_alert_type AS ENUM ('ssl_expiry', 'mail_queue', 'db_slow_query', 'http_health', 'process_health', 'anomaly', 'agent');
CREATE TYPE public.monitoring_alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE public.monitoring_alert_status AS ENUM ('open', 'acknowledged', 'resolved');
CREATE TYPE public.incident_status AS ENUM ('investigating', 'identified', 'monitoring', 'resolved');

CREATE TABLE public.monitoring_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  agent_version TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ,
  status public.health_status NOT NULL DEFAULT 'unknown',
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hostname)
);

CREATE TABLE public.site_process_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  process_name TEXT NOT NULL,
  status public.health_status NOT NULL DEFAULT 'unknown',
  cpu_percent NUMERIC NOT NULL DEFAULT 0,
  memory_mb NUMERIC NOT NULL DEFAULT 0,
  restart_count INTEGER NOT NULL DEFAULT 0,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, process_name)
);

CREATE TABLE public.site_http_health_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  expected_status INTEGER NOT NULL DEFAULT 200,
  response_time_ms INTEGER,
  last_status_code INTEGER,
  status public.health_status NOT NULL DEFAULT 'unknown',
  ssl_expires_at TIMESTAMPTZ,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, label)
);

CREATE TABLE public.monitoring_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  alert_type public.monitoring_alert_type NOT NULL,
  severity public.monitoring_alert_severity NOT NULL DEFAULT 'warning',
  status public.monitoring_alert_status NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status public.incident_status NOT NULL DEFAULT 'investigating',
  severity public.monitoring_alert_severity NOT NULL DEFAULT 'warning',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  summary TEXT,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.monitoring_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_process_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_http_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view monitoring agents"
ON public.monitoring_agents FOR SELECT TO authenticated
USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage monitoring agents"
ON public.monitoring_agents FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view process health"
ON public.site_process_health FOR SELECT TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can manage process health"
ON public.site_process_health FOR ALL TO authenticated
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view HTTP health checks"
ON public.site_http_health_checks FOR SELECT TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can manage HTTP health checks"
ON public.site_http_health_checks FOR ALL TO authenticated
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view monitoring alerts"
ON public.monitoring_alerts FOR SELECT TO authenticated
USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage monitoring alerts"
ON public.monitoring_alerts FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view incidents"
ON public.site_incidents FOR SELECT TO authenticated
USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage incidents"
ON public.site_incidents FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_monitoring_agents_updated_at BEFORE UPDATE ON public.monitoring_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_process_health_updated_at BEFORE UPDATE ON public.site_process_health FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_http_health_checks_updated_at BEFORE UPDATE ON public.site_http_health_checks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_incidents_updated_at BEFORE UPDATE ON public.site_incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
