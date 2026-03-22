CREATE TYPE public.ssl_certificate_status AS ENUM ('pending', 'issued', 'renewing', 'revoked', 'failed', 'expiring');
CREATE TYPE public.ssl_challenge_type AS ENUM ('http_01', 'dns_01');

CREATE TABLE public.site_ssl_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL UNIQUE REFERENCES public.sites(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'lets_encrypt',
  challenge_type public.ssl_challenge_type NOT NULL DEFAULT 'http_01',
  is_wildcard BOOLEAN NOT NULL DEFAULT false,
  primary_domain TEXT NOT NULL,
  alternate_names TEXT[] NOT NULL DEFAULT '{}',
  dns_provider TEXT,
  auto_redirect_http BOOLEAN NOT NULL DEFAULT true,
  certificate_status public.ssl_certificate_status NOT NULL DEFAULT 'pending',
  issued_at TIMESTAMPTZ,
  renewed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  alert_before_days INTEGER NOT NULL DEFAULT 14,
  last_alert_sent_at TIMESTAMPTZ,
  certificate_chain_issuer TEXT,
  certificate_chain_valid BOOLEAN,
  certificate_chain_diagnostics TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_ssl_certificates_dns01_required CHECK (NOT is_wildcard OR challenge_type = 'dns_01')
);

ALTER TABLE public.site_ssl_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view SSL certificates of their sites"
ON public.site_ssl_certificates FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can manage SSL certificates"
ON public.site_ssl_certificates FOR ALL
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE TRIGGER update_site_ssl_certificates_updated_at
BEFORE UPDATE ON public.site_ssl_certificates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
