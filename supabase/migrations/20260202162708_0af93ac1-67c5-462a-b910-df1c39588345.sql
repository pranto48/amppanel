-- Create system_metrics table to store server metrics
CREATE TABLE public.system_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  cpu_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  memory_used_mb NUMERIC(12,2) NOT NULL DEFAULT 0,
  memory_total_mb NUMERIC(12,2) NOT NULL DEFAULT 0,
  disk_used_gb NUMERIC(12,2) NOT NULL DEFAULT 0,
  disk_total_gb NUMERIC(12,2) NOT NULL DEFAULT 0,
  network_in_mbps NUMERIC(10,2) NOT NULL DEFAULT 0,
  network_out_mbps NUMERIC(10,2) NOT NULL DEFAULT 0,
  load_avg_1m NUMERIC(6,2),
  load_avg_5m NUMERIC(6,2),
  load_avg_15m NUMERIC(6,2),
  uptime_seconds BIGINT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_system_metrics_recorded_at ON public.system_metrics(recorded_at DESC);
CREATE INDEX idx_system_metrics_site_id ON public.system_metrics(site_id);

-- Enable RLS
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users with site access can view metrics
CREATE POLICY "Users can view metrics for their sites"
ON public.system_metrics FOR SELECT
TO authenticated
USING (
  site_id IS NULL OR has_site_access(auth.uid(), site_id)
);

-- Policy: Allow inserting metrics (for edge functions)
CREATE POLICY "Allow inserting system metrics"
ON public.system_metrics FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to clean up old metrics (keep last 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.system_metrics
  WHERE recorded_at < now() - INTERVAL '7 days';
END;
$$;