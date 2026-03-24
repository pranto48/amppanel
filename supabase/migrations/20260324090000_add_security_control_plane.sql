CREATE TYPE public.security_scan_type AS ENUM ('malware', 'vulnerability', 'secret_scan');
CREATE TYPE public.audit_event_category AS ENUM ('firewall', 'waf', 'ssh', 'scan', 'auth', 'intel', 'system');

CREATE TABLE public.firewall_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  adapter_type TEXT NOT NULL DEFAULT 'host_ufw',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.firewall_rules_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.firewall_providers(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'inbound',
  protocol TEXT NOT NULL DEFAULT 'tcp',
  port TEXT NOT NULL,
  source_cidr TEXT NOT NULL DEFAULT '0.0.0.0/0',
  action TEXT NOT NULL DEFAULT 'allow',
  priority INTEGER NOT NULL DEFAULT 100,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.waf_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'detection',
  engine TEXT NOT NULL DEFAULT 'modsecurity',
  ruleset_version TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.waf_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES public.waf_policies(id) ON DELETE SET NULL,
  source_ip INET,
  country_code TEXT,
  rule_id TEXT,
  threat_type TEXT,
  severity TEXT NOT NULL DEFAULT 'warning',
  action_taken TEXT NOT NULL DEFAULT 'blocked',
  request_path TEXT,
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ssh_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  key_name TEXT NOT NULL,
  public_key TEXT NOT NULL,
  fingerprint TEXT,
  algorithm TEXT,
  comment TEXT,
  source_ip INET,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE public.site_security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  scan_type public.security_scan_type NOT NULL,
  scanner_name TEXT NOT NULL,
  target_path TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  severity TEXT NOT NULL DEFAULT 'info',
  findings_count INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.secret_scan_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES public.site_security_scans(id) ON DELETE SET NULL,
  source_kind TEXT NOT NULL DEFAULT 'code_upload',
  file_path TEXT,
  line_number INTEGER,
  detector TEXT NOT NULL,
  secret_type TEXT NOT NULL,
  match_preview TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE public.login_geo_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_ip INET,
  country_code TEXT,
  region TEXT,
  city TEXT,
  asn TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMPTZ
);

CREATE TABLE public.ip_reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  source_ip INET NOT NULL,
  provider_name TEXT NOT NULL,
  reputation_score NUMERIC,
  confidence NUMERIC,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_recommended TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.security_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category public.audit_event_category NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_ip INET,
  user_agent TEXT,
  event_hash TEXT NOT NULL,
  prev_event_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX security_audit_events_event_hash_idx ON public.security_audit_events(event_hash);
CREATE INDEX security_audit_events_created_at_idx ON public.security_audit_events(created_at DESC);

CREATE OR REPLACE FUNCTION public.prevent_security_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'security_audit_events is immutable';
END;
$$;

CREATE OR REPLACE FUNCTION public.set_security_audit_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  prev_hash TEXT;
BEGIN
  SELECT event_hash INTO prev_hash
  FROM public.security_audit_events
  WHERE site_id IS NOT DISTINCT FROM NEW.site_id
  ORDER BY created_at DESC
  LIMIT 1;

  NEW.prev_event_hash := prev_hash;
  NEW.event_hash := encode(
    digest(
      coalesce(NEW.site_id::text,'') || '|' ||
      coalesce(NEW.actor_id::text,'') || '|' ||
      NEW.category::text || '|' ||
      NEW.action || '|' ||
      coalesce(NEW.target_type,'') || '|' ||
      coalesce(NEW.target_id,'') || '|' ||
      coalesce(prev_hash,'') || '|' ||
      coalesce(NEW.created_at::text, now()::text),
      'sha256'
    ),
    'hex'
  );

  RETURN NEW;
END;
$$;

ALTER TABLE public.firewall_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firewall_rules_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waf_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waf_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ssh_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_security_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secret_scan_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_geo_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view firewall providers" ON public.firewall_providers FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage firewall providers" ON public.firewall_providers FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view firewall rules v2" ON public.firewall_rules_v2 FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage firewall rules v2" ON public.firewall_rules_v2 FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view waf policies" ON public.waf_policies FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage waf policies" ON public.waf_policies FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view waf events" ON public.waf_events FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage waf events" ON public.waf_events FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view ssh keys" ON public.ssh_keys FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage ssh keys" ON public.ssh_keys FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view security scans" ON public.site_security_scans FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage security scans" ON public.site_security_scans FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view secret findings" ON public.secret_scan_findings FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage secret findings" ON public.secret_scan_findings FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view login geo alerts" ON public.login_geo_alerts FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "Admins can manage login geo alerts" ON public.login_geo_alerts FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view ip reputation events" ON public.ip_reputation_events FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage ip reputation events" ON public.ip_reputation_events FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view security audit events" ON public.security_audit_events FOR SELECT TO authenticated USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert security audit events" ON public.security_audit_events FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_firewall_providers_updated_at BEFORE UPDATE ON public.firewall_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_firewall_rules_v2_updated_at BEFORE UPDATE ON public.firewall_rules_v2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_waf_policies_updated_at BEFORE UPDATE ON public.waf_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER security_audit_hash_trigger BEFORE INSERT ON public.security_audit_events FOR EACH ROW EXECUTE FUNCTION public.set_security_audit_hash();
CREATE TRIGGER security_audit_no_update BEFORE UPDATE ON public.security_audit_events FOR EACH ROW EXECUTE FUNCTION public.prevent_security_audit_mutation();
CREATE TRIGGER security_audit_no_delete BEFORE DELETE ON public.security_audit_events FOR EACH ROW EXECUTE FUNCTION public.prevent_security_audit_mutation();

INSERT INTO public.firewall_providers (provider_name, adapter_type, config)
VALUES ('Host UFW', 'host_ufw', '{"default_inbound":"deny","default_outbound":"allow"}'::jsonb)
ON CONFLICT DO NOTHING;
