-- Create enum for backup status
CREATE TYPE public.backup_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- Create enum for backup type
CREATE TYPE public.backup_type AS ENUM ('full', 'files', 'database', 'scheduled');

-- Create backups table
CREATE TABLE public.backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  backup_type backup_type NOT NULL DEFAULT 'full',
  status backup_status NOT NULL DEFAULT 'pending',
  size_mb NUMERIC NOT NULL DEFAULT 0,
  file_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view backups of their sites"
  ON public.backups FOR SELECT
  USING (has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can create backups"
  ON public.backups FOR INSERT
  WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Owners and admins can update backups"
  ON public.backups FOR UPDATE
  USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Owners and admins can delete backups"
  ON public.backups FOR DELETE
  USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));