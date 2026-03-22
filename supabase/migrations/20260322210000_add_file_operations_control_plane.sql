CREATE TYPE public.file_operation_type AS ENUM ('extract_archive', 'git_clone', 'git_pull', 'set_permissions', 'fix_ownership', 'publish_archive_site');
CREATE TYPE public.file_operation_status AS ENUM ('queued', 'running', 'completed', 'failed');
CREATE TYPE public.malware_scan_status AS ENUM ('clean', 'warning', 'infected');

CREATE TABLE public.file_operation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  operation public.file_operation_type NOT NULL,
  status public.file_operation_status NOT NULL DEFAULT 'queued',
  target_path TEXT,
  source_path TEXT,
  output TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.file_version_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'modified',
  content_hash TEXT,
  diff_summary TEXT,
  content_preview TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (site_id, file_path, version_number)
);

CREATE TABLE public.file_malware_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  status public.malware_scan_status NOT NULL DEFAULT 'clean',
  threat_name TEXT,
  signature_version TEXT,
  scan_summary TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.file_operation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_malware_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view file operations"
ON public.file_operation_runs FOR SELECT TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can manage file operations"
ON public.file_operation_runs FOR ALL TO authenticated
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view file version history"
ON public.file_version_history FOR SELECT TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can manage file version history"
ON public.file_version_history FOR ALL TO authenticated
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view malware scans"
ON public.file_malware_scans FOR SELECT TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can manage malware scans"
ON public.file_malware_scans FOR ALL TO authenticated
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]) OR public.is_admin(auth.uid()));
