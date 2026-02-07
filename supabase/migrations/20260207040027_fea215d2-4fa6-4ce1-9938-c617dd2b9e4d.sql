-- Create cron job execution logs table
CREATE TABLE public.cron_job_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.cron_jobs(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running',
  output TEXT,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_cron_job_logs_job_id ON public.cron_job_logs(job_id);
CREATE INDEX idx_cron_job_logs_started_at ON public.cron_job_logs(started_at DESC);

-- Enable RLS
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - admins only
CREATE POLICY "Admins can view cron job logs"
  ON public.cron_job_logs
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert cron job logs"
  ON public.cron_job_logs
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete old logs"
  ON public.cron_job_logs
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Add comment
COMMENT ON TABLE public.cron_job_logs IS 'Stores execution history for cron jobs';