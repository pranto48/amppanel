-- Create enum for activity types
CREATE TYPE public.activity_type AS ENUM (
  'login',
  'logout',
  'site_created',
  'site_updated',
  'site_deleted',
  'database_created',
  'database_deleted',
  'backup_created',
  'backup_restored',
  'backup_deleted',
  'file_uploaded',
  'file_deleted',
  'file_modified',
  'user_invited',
  'user_removed',
  'role_changed',
  'settings_updated',
  'password_changed',
  'security_alert'
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type public.activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX idx_activity_logs_site_id ON public.activity_logs(site_id);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own activity logs
CREATE POLICY "Users can create their own activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all activity logs for sites they manage
CREATE POLICY "Admins can view site activity logs"
ON public.activity_logs
FOR SELECT
USING (
  site_id IS NOT NULL AND 
  get_site_role(auth.uid(), site_id) IN ('owner', 'admin')
);