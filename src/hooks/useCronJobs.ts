import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";

export type CronJob = Tables<"cron_jobs">;
export type CronJobInsert = TablesInsert<"cron_jobs">;
export type CronJobType = Enums<"cron_job_type">;
export type CronJobStatus = Enums<"cron_job_status">;

// Calculate next run time based on cron expression
const calculateNextRun = (schedule: string): string => {
  const now = new Date();
  // Simple implementation - for production, use a proper cron parser
  const parts = schedule.split(" ");
  if (parts.length !== 5) return now.toISOString();

  const [minute, hour] = parts;
  const next = new Date(now);
  
  if (hour !== "*") {
    next.setHours(parseInt(hour, 10));
  }
  if (minute !== "*") {
    next.setMinutes(parseInt(minute, 10));
  }
  next.setSeconds(0);
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next.toISOString();
};

export const useCronJobs = (siteId?: string) => {
  return useQuery({
    queryKey: ["cron_jobs", siteId],
    queryFn: async () => {
      let query = supabase
        .from("cron_jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (siteId) {
        query = query.eq("site_id", siteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateCronJob = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (job: Omit<CronJobInsert, 'next_run_at'> & { schedule: string }) => {
      const nextRun = calculateNextRun(job.schedule);

      const { data, error } = await supabase
        .from("cron_jobs")
        .insert({
          ...job,
          next_run_at: nextRun,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cron_jobs"] });
      toast({
        title: "Cron Job Created",
        description: "The scheduled task has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Create",
        description: error.message,
      });
    },
  });
};

export const useUpdateCronJob = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CronJob> & { id: string }) => {
      const updateData: any = { ...updates };
      
      // Recalculate next run if schedule changed
      if (updates.schedule) {
        updateData.next_run_at = calculateNextRun(updates.schedule);
      }

      const { data, error } = await supabase
        .from("cron_jobs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cron_jobs"] });
      toast({
        title: "Cron Job Updated",
        description: "The scheduled task has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Update",
        description: error.message,
      });
    },
  });
};

export const useDeleteCronJob = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cron_jobs").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cron_jobs"] });
      toast({
        title: "Cron Job Deleted",
        description: "The scheduled task has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Delete",
        description: error.message,
      });
    },
  });
};

export const useRunCronJob = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Update status to running
      await supabase
        .from("cron_jobs")
        .update({ last_status: "running", last_run_at: new Date().toISOString() })
        .eq("id", id);

      // Invoke the edge function to run the job
      const { data, error } = await supabase.functions.invoke("cron-runner", {
        body: { job_id: id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cron_jobs"] });
      toast({
        title: "Job Started",
        description: "The cron job is now running.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Run",
        description: error.message,
      });
    },
  });
};
