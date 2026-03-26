ALTER TYPE public.service_action_type ADD VALUE IF NOT EXISTS 'test';

ALTER TABLE public.site_service_configs
ADD COLUMN IF NOT EXISTS php_ini_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS access_log_path TEXT,
ADD COLUMN IF NOT EXISTS error_log_path TEXT,
ADD COLUMN IF NOT EXISTS last_test_output TEXT,
ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_test_passed BOOLEAN;

UPDATE public.site_service_configs
SET access_log_path = COALESCE(access_log_path, '/var/log/amp/' || replace(site_id::text, '-', '') || '_access.log'),
    error_log_path = COALESCE(error_log_path, '/var/log/amp/' || replace(site_id::text, '-', '') || '_error.log')
WHERE access_log_path IS NULL OR error_log_path IS NULL;

ALTER TABLE public.site_service_configs
ALTER COLUMN access_log_path SET DEFAULT '/var/log/amp/default_access.log',
ALTER COLUMN error_log_path SET DEFAULT '/var/log/amp/default_error.log';

CREATE TABLE IF NOT EXISTS public.site_service_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  config_id UUID REFERENCES public.site_service_configs(id) ON DELETE SET NULL,
  log_type TEXT NOT NULL CHECK (log_type IN ('access', 'error')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_service_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service logs of their sites"
ON public.site_service_logs FOR SELECT
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can insert service logs"
ON public.site_service_logs FOR INSERT
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));
