CREATE TYPE public.dns_zone_status AS ENUM ('active', 'pending', 'paused', 'error');
CREATE TYPE public.dns_record_type AS ENUM ('A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR');
CREATE TYPE public.dns_record_status AS ENUM ('active', 'pending', 'error');
CREATE TYPE public.dns_template_scope AS ENUM ('system', 'site');
CREATE TYPE public.dns_propagation_status AS ENUM ('pending', 'healthy', 'warning', 'failed');

CREATE TABLE public.dns_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'amp_dns',
  role TEXT NOT NULL DEFAULT 'primary',
  location TEXT,
  endpoint TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dns_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID UNIQUE REFERENCES public.sites(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES public.dns_clusters(id) ON DELETE SET NULL,
  origin TEXT NOT NULL UNIQUE,
  status public.dns_zone_status NOT NULL DEFAULT 'pending',
  zone_type TEXT NOT NULL DEFAULT 'primary',
  serial BIGINT NOT NULL DEFAULT 2026032201,
  refresh_seconds INTEGER NOT NULL DEFAULT 3600,
  retry_seconds INTEGER NOT NULL DEFAULT 900,
  expire_seconds INTEGER NOT NULL DEFAULT 1209600,
  minimum_ttl_seconds INTEGER NOT NULL DEFAULT 300,
  default_ttl_seconds INTEGER NOT NULL DEFAULT 3600,
  primary_nameserver TEXT NOT NULL DEFAULT 'ns1.amp-dns.com',
  admin_email TEXT NOT NULL DEFAULT 'dns-admin.amp.local',
  dnssec_enabled BOOLEAN NOT NULL DEFAULT false,
  transfer_acl TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dns_record_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  scope public.dns_template_scope NOT NULL DEFAULT 'system',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  records JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dns_record_templates_site_scope_check CHECK (
    (scope = 'system' AND site_id IS NULL) OR (scope = 'site' AND site_id IS NOT NULL)
  )
);

CREATE TABLE public.dns_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.dns_zones(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.dns_record_templates(id) ON DELETE SET NULL,
  type public.dns_record_type NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  ttl INTEGER NOT NULL DEFAULT 3600,
  priority INTEGER,
  weight INTEGER,
  port INTEGER,
  target TEXT,
  proxied BOOLEAN NOT NULL DEFAULT false,
  is_glue BOOLEAN NOT NULL DEFAULT false,
  status public.dns_record_status NOT NULL DEFAULT 'pending',
  last_validated_at TIMESTAMPTZ,
  validation_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dns_secondary_nameservers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.dns_zones(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  ipv4 TEXT,
  ipv6 TEXT,
  transfer_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dns_glue_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.dns_zones(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL,
  ipv4 TEXT,
  ipv6 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dns_glue_records_ip_required CHECK (ipv4 IS NOT NULL OR ipv6 IS NOT NULL)
);

CREATE TABLE public.dns_propagation_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.dns_zones(id) ON DELETE CASCADE,
  record_id UUID REFERENCES public.dns_records(id) ON DELETE CASCADE,
  resolver TEXT NOT NULL,
  status public.dns_propagation_status NOT NULL DEFAULT 'pending',
  observed_value TEXT,
  expected_value TEXT,
  latency_ms INTEGER,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details TEXT
);

CREATE INDEX idx_dns_zones_site_id ON public.dns_zones(site_id);
CREATE INDEX idx_dns_records_zone_id ON public.dns_records(zone_id);
CREATE INDEX idx_dns_secondary_nameservers_zone_id ON public.dns_secondary_nameservers(zone_id);
CREATE INDEX idx_dns_glue_records_zone_id ON public.dns_glue_records(zone_id);
CREATE INDEX idx_dns_propagation_checks_zone_id ON public.dns_propagation_checks(zone_id, checked_at DESC);

ALTER TABLE public.dns_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_record_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_secondary_nameservers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_glue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_propagation_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dns clusters"
ON public.dns_clusters FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage dns clusters"
ON public.dns_clusters FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view dns zones of their sites"
ON public.dns_zones FOR SELECT
USING (site_id IS NULL OR public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can manage dns zones"
ON public.dns_zones FOR ALL
USING (site_id IS NOT NULL AND public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (site_id IS NOT NULL AND public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Users can view dns templates"
ON public.dns_record_templates FOR SELECT
USING (scope = 'system' OR (site_id IS NOT NULL AND public.has_site_access(auth.uid(), site_id)));

CREATE POLICY "Owners and admins can manage site dns templates"
ON public.dns_record_templates FOR ALL
USING (scope = 'site' AND site_id IS NOT NULL AND public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (scope = 'site' AND site_id IS NOT NULL AND public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Users can view dns records"
ON public.dns_records FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND (z.site_id IS NULL OR public.has_site_access(auth.uid(), z.site_id))
));

CREATE POLICY "Owners and admins can manage dns records"
ON public.dns_records FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND z.site_id IS NOT NULL AND public.get_site_role(auth.uid(), z.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND z.site_id IS NOT NULL AND public.get_site_role(auth.uid(), z.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
));

CREATE POLICY "Users can view dns secondaries"
ON public.dns_secondary_nameservers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND (z.site_id IS NULL OR public.has_site_access(auth.uid(), z.site_id))
));

CREATE POLICY "Owners and admins can manage dns secondaries"
ON public.dns_secondary_nameservers FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND z.site_id IS NOT NULL AND public.get_site_role(auth.uid(), z.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND z.site_id IS NOT NULL AND public.get_site_role(auth.uid(), z.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
));

CREATE POLICY "Users can view dns glue records"
ON public.dns_glue_records FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND (z.site_id IS NULL OR public.has_site_access(auth.uid(), z.site_id))
));

CREATE POLICY "Owners and admins can manage dns glue records"
ON public.dns_glue_records FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND z.site_id IS NOT NULL AND public.get_site_role(auth.uid(), z.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND z.site_id IS NOT NULL AND public.get_site_role(auth.uid(), z.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
));

CREATE POLICY "Users can view dns propagation checks"
ON public.dns_propagation_checks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND (z.site_id IS NULL OR public.has_site_access(auth.uid(), z.site_id))
));

CREATE POLICY "Owners and admins can manage dns propagation checks"
ON public.dns_propagation_checks FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND z.site_id IS NOT NULL AND public.get_site_role(auth.uid(), z.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.dns_zones z
  WHERE z.id = zone_id AND z.site_id IS NOT NULL AND public.get_site_role(auth.uid(), z.site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role])
));

CREATE TRIGGER update_dns_clusters_updated_at
BEFORE UPDATE ON public.dns_clusters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dns_zones_updated_at
BEFORE UPDATE ON public.dns_zones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dns_record_templates_updated_at
BEFORE UPDATE ON public.dns_record_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dns_records_updated_at
BEFORE UPDATE ON public.dns_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dns_secondary_nameservers_updated_at
BEFORE UPDATE ON public.dns_secondary_nameservers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dns_glue_records_updated_at
BEFORE UPDATE ON public.dns_glue_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.dns_clusters (name, provider, role, location, endpoint)
VALUES
  ('AMP Primary DNS', 'amp_dns', 'primary', 'us-east-1', 'ns1.amp-dns.com'),
  ('AMP Secondary DNS', 'amp_dns', 'secondary', 'us-west-2', 'ns2.amp-dns.com')
ON CONFLICT DO NOTHING;

INSERT INTO public.dns_record_templates (name, description, scope, records)
VALUES
  (
    'Web + Mail Starter',
    'Bootstraps apex, www, MX, SPF, DMARC, and autodiscover defaults.',
    'system',
    '[
      {"type":"A","name":"@","content":"198.51.100.10","ttl":300},
      {"type":"CNAME","name":"www","content":"@","ttl":300},
      {"type":"MX","name":"@","content":"mail.__ZONE__","priority":10,"ttl":3600},
      {"type":"TXT","name":"@","content":"v=spf1 mx ~all","ttl":3600},
      {"type":"TXT","name":"_dmarc","content":"v=DMARC1; p=quarantine; rua=mailto:hostmaster@__ZONE__","ttl":3600}
    ]'::jsonb
  ),
  (
    'Delegated Zone Baseline',
    'Creates NS records suitable for secondary DNS delegation and glue planning.',
    'system',
    '[
      {"type":"NS","name":"@","content":"ns1.amp-dns.com","ttl":3600},
      {"type":"NS","name":"@","content":"ns2.amp-dns.com","ttl":3600}
    ]'::jsonb
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.dns_zones (site_id, cluster_id, origin, status, zone_type, serial, primary_nameserver, admin_email, metadata)
SELECT
  s.id,
  (SELECT id FROM public.dns_clusters ORDER BY created_at ASC LIMIT 1),
  lower(s.domain),
  CASE WHEN s.status = 'active' THEN 'active'::public.dns_zone_status ELSE 'pending'::public.dns_zone_status END,
  'primary',
  2026032201 + ROW_NUMBER() OVER (ORDER BY s.created_at),
  'ns1.amp-dns.com',
  replace('hostmaster@' || lower(s.domain), '@', '.'),
  jsonb_build_object('created_from', 'sites_migration')
FROM public.sites s
ON CONFLICT (origin) DO NOTHING;
