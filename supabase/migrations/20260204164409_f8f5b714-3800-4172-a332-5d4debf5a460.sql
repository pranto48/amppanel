-- Create cron job type enum
CREATE TYPE public.cron_job_type AS ENUM ('backup', 'cleanup', 'maintenance', 'custom');

-- Create cron job status enum
CREATE TYPE public.cron_job_status AS ENUM ('success', 'failed', 'running');

-- Create cron_jobs table
CREATE TABLE public.cron_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT NOT NULL,
  command TEXT NOT NULL,
  job_type public.cron_job_type NOT NULL DEFAULT 'custom',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  last_status public.cron_job_status,
  last_output TEXT,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cron_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all cron jobs" 
ON public.cron_jobs 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create cron jobs" 
ON public.cron_jobs 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update cron jobs" 
ON public.cron_jobs 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete cron jobs" 
ON public.cron_jobs 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_cron_jobs_updated_at
BEFORE UPDATE ON public.cron_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample cron jobs
INSERT INTO public.cron_jobs (name, description, schedule, command, job_type, is_enabled, next_run_at) VALUES
('Daily Database Backup', 'Backs up all databases to the backup storage', '0 2 * * *', '/usr/bin/pg_dump -U postgres -d amp_panel > /backups/daily_$(date +%Y%m%d).sql', 'backup', true, (now() + interval '1 day')::timestamptz),
('Weekly Log Cleanup', 'Removes log files older than 30 days', '0 3 * * 0', 'find /var/log -type f -name "*.log" -mtime +30 -delete', 'cleanup', true, (now() + interval '7 days')::timestamptz),
('Monthly Disk Optimization', 'Runs disk optimization and defragmentation', '0 4 1 * *', '/usr/sbin/fstrim -av && sync', 'maintenance', true, (now() + interval '1 month')::timestamptz),
('Hourly Cache Clear', 'Clears application cache every hour', '0 * * * *', 'rm -rf /var/cache/app/* && echo "Cache cleared"', 'cleanup', false, (now() + interval '1 hour')::timestamptz);