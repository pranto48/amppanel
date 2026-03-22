CREATE TYPE public.offsite_storage_provider AS ENUM ('s3', 'backblaze_b2', 'wasabi', 'gcs');
CREATE TYPE public.restore_mode AS ENUM ('full', 'files_only', 'database_only', 'partial');
CREATE TYPE public.restore_status AS ENUM ('previewing', 'ready', 'restoring', 'completed', 'failed', 'cancelled');
CREATE TYPE public.backup_verification_status AS ENUM ('pending', 'verified', 'warning', 'failed');

ALTER TABLE public.backups
  ADD COLUMN storage_provider public.offsite_storage_provider,
  ADD COLUMN storage_bucket TEXT,
  ADD COLUMN storage_region TEXT,
  ADD COLUMN storage_path TEXT,
  ADD COLUMN checksum_sha256 TEXT,
  ADD COLUMN verification_status public.backup_verification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN verification_checked_at TIMESTAMPTZ,
  ADD COLUMN contains_files BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN contains_database BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN point_in_time_reference TIMESTAMPTZ,
  ADD COLUMN restore_preview JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.backup_restore_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_id UUID NOT NULL REFERENCES public.backups(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  mode public.restore_mode NOT NULL DEFAULT 'full',
  point_in_time_target TIMESTAMPTZ,
  restore_files BOOLEAN NOT NULL DEFAULT true,
  restore_database BOOLEAN NOT NULL DEFAULT true,
  target_path TEXT,
  target_database TEXT,
  sandbox_preview_status public.restore_status NOT NULL DEFAULT 'previewing',
  sandbox_preview_summary TEXT,
  preview_manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  overwrite_confirmed BOOLEAN NOT NULL DEFAULT false,
  status public.restore_status NOT NULL DEFAULT 'previewing',
  status_log TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT backup_restore_jobs_partial_target_check CHECK (
    mode <> 'partial' OR target_path IS NOT NULL OR target_database IS NOT NULL
  ),
  CONSTRAINT backup_restore_jobs_point_in_time_check CHECK (
    mode <> 'database_only' OR restore_database = true
  )
);

ALTER TABLE public.backup_restore_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view restore jobs of their sites"
ON public.backup_restore_jobs FOR SELECT
TO authenticated
USING (public.has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can manage restore jobs"
ON public.backup_restore_jobs FOR ALL
TO authenticated
USING (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]))
WITH CHECK (public.get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE TRIGGER update_backup_restore_jobs_updated_at
BEFORE UPDATE ON public.backup_restore_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
