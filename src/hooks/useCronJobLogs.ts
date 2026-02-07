import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CronJobLog {
  id: string;
  job_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  output: string | null;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export const useCronJobLogs = (jobId?: string) => {
  return useQuery({
    queryKey: ["cron_job_logs", jobId],
    queryFn: async () => {
      let query = supabase
        .from("cron_job_logs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(100);

      if (jobId) {
        query = query.eq("job_id", jobId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CronJobLog[];
    },
  });
};

export const useClearCronJobLogs = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (jobId?: string) => {
      let query = supabase.from("cron_job_logs").delete();
      
      if (jobId) {
        query = query.eq("job_id", jobId);
      } else {
        // Delete all logs older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.lt("created_at", sevenDaysAgo.toISOString());
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["cron_job_logs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["cron_job_logs"] });
      toast({
        title: "Logs Cleared",
        description: "Execution logs have been cleared successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Clear Logs",
        description: error.message,
      });
    },
  });
};
