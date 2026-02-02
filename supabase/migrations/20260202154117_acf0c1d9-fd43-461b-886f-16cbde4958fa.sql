-- Create enum for backup frequency
CREATE TYPE public.backup_frequency AS ENUM ('daily', 'weekly', 'monthly');

-- Create backup_schedules table
CREATE TABLE public.backup_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency backup_frequency NOT NULL DEFAULT 'daily',
  backup_type backup_type NOT NULL DEFAULT 'full',
  retention_days INTEGER NOT NULL DEFAULT 30,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, name)
);

-- Enable RLS
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view schedules of their sites"
  ON public.backup_schedules FOR SELECT
  USING (has_site_access(auth.uid(), site_id));

CREATE POLICY "Owners and admins can create schedules"
  ON public.backup_schedules FOR INSERT
  WITH CHECK (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Owners and admins can update schedules"
  ON public.backup_schedules FOR UPDATE
  USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

CREATE POLICY "Owners and admins can delete schedules"
  ON public.backup_schedules FOR DELETE
  USING (get_site_role(auth.uid(), site_id) = ANY (ARRAY['owner'::site_role, 'admin'::site_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_backup_schedules_updated_at
  BEFORE UPDATE ON public.backup_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();