CREATE TYPE public.hosting_billing_cycle AS ENUM ('monthly', 'quarterly', 'yearly');
CREATE TYPE public.resource_alert_type AS ENUM ('storage', 'bandwidth', 'domains', 'subdomains', 'databases', 'mailboxes', 'cron_jobs');
CREATE TYPE public.resource_alert_status AS ENUM ('open', 'acknowledged', 'resolved');

CREATE TABLE public.hosting_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  billing_cycle public.hosting_billing_cycle NOT NULL DEFAULT 'monthly',
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  storage_limit_mb INTEGER NOT NULL DEFAULT 10240,
  bandwidth_limit_gb INTEGER NOT NULL DEFAULT 100,
  max_domains INTEGER NOT NULL DEFAULT 1,
  max_subdomains INTEGER NOT NULL DEFAULT 10,
  max_databases INTEGER NOT NULL DEFAULT 5,
  max_mailboxes INTEGER NOT NULL DEFAULT 10,
  max_cron_jobs INTEGER NOT NULL DEFAULT 5,
  supports_nodejs BOOLEAN NOT NULL DEFAULT true,
  php_versions TEXT[] NOT NULL DEFAULT ARRAY['8.2'],
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reseller_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  max_client_accounts INTEGER NOT NULL DEFAULT 25,
  max_sites INTEGER NOT NULL DEFAULT 100,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_hosting_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL UNIQUE REFERENCES public.sites(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.hosting_packages(id) ON DELETE RESTRICT,
  reseller_account_id UUID REFERENCES public.reseller_accounts(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignment_status TEXT NOT NULL DEFAULT 'active',
  next_billing_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.resource_overuse_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.hosting_packages(id) ON DELETE SET NULL,
  alert_type public.resource_alert_type NOT NULL,
  status public.resource_alert_status NOT NULL DEFAULT 'open',
  current_value NUMERIC(12,2) NOT NULL,
  limit_value NUMERIC(12,2) NOT NULL,
  message TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hosting_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_hosting_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_overuse_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view hosting packages"
ON public.hosting_packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage hosting packages"
ON public.hosting_packages FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view reseller accounts"
ON public.reseller_accounts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR profile_id = auth.uid());
CREATE POLICY "Admins can manage reseller accounts"
ON public.reseller_accounts FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view site hosting assignments"
ON public.site_hosting_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND public.has_site_access(auth.uid(), s.id)) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage site hosting assignments"
ON public.site_hosting_assignments FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view overuse alerts"
ON public.resource_overuse_alerts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND public.has_site_access(auth.uid(), s.id)) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage overuse alerts"
ON public.resource_overuse_alerts FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_hosting_packages_updated_at BEFORE UPDATE ON public.hosting_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reseller_accounts_updated_at BEFORE UPDATE ON public.reseller_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_hosting_assignments_updated_at BEFORE UPDATE ON public.site_hosting_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.hosting_packages (name, description, billing_cycle, price_usd, storage_limit_mb, bandwidth_limit_gb, max_domains, max_subdomains, max_databases, max_mailboxes, max_cron_jobs, php_versions, features)
VALUES
  ('Starter', 'Single-site package for simple hosting accounts.', 'monthly', 9.99, 5120, 100, 1, 10, 3, 5, 3, ARRAY['8.1','8.2'], '{"ssl":true,"backup":true}'::jsonb),
  ('Business', 'Multi-service package with more room for mail, databases, and cron.', 'monthly', 24.99, 20480, 500, 5, 50, 15, 25, 15, ARRAY['8.1','8.2','8.3'], '{"ssl":true,"backup":true,"nodejs":true}'::jsonb),
  ('Reseller Pro', 'Reseller-focused package for agencies managing many hosting accounts.', 'monthly', 79.99, 102400, 2000, 50, 250, 100, 200, 100, ARRAY['8.1','8.2','8.3'], '{"ssl":true,"backup":true,"nodejs":true,"white_label":true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.site_hosting_assignments (site_id, package_id, assignment_status, notes)
SELECT s.id, (SELECT id FROM public.hosting_packages ORDER BY price_usd ASC LIMIT 1), CASE WHEN s.status = 'suspended' THEN 'suspended' ELSE 'active' END, 'Auto-assigned during hosting packages migration.'
FROM public.sites s
ON CONFLICT (site_id) DO NOTHING;

INSERT INTO public.resource_overuse_alerts (site_id, package_id, alert_type, current_value, limit_value, message)
SELECT s.id, sha.package_id, 'storage', s.storage_used_mb, s.storage_limit_mb, 'Storage usage is approaching or exceeding the assigned package limit.'
FROM public.sites s
JOIN public.site_hosting_assignments sha ON sha.site_id = s.id
WHERE s.storage_used_mb >= s.storage_limit_mb * 0.85
ON CONFLICT DO NOTHING;
