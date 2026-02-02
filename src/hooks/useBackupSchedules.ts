import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BackupSchedule {
  id: string;
  site_id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  backup_type: "full" | "files" | "database" | "scheduled";
  retention_days: number;
  is_enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackupScheduleInsert {
  site_id: string;
  name: string;
  frequency?: BackupSchedule["frequency"];
  backup_type?: BackupSchedule["backup_type"];
  retention_days?: number;
  is_enabled?: boolean;
}

export const useBackupSchedules = (siteId?: string) => {
  return useQuery({
    queryKey: ["backup_schedules", siteId],
    queryFn: async () => {
      let query = supabase
        .from("backup_schedules")
        .select("*")
        .order("created_at", { ascending: false });

      if (siteId) {
        query = query.eq("site_id", siteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BackupSchedule[];
    },
  });
};

export const useCreateBackupSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schedule: BackupScheduleInsert) => {
      // Calculate next run time based on frequency
      const now = new Date();
      let nextRun = new Date(now);
      
      switch (schedule.frequency) {
        case "daily":
          nextRun.setDate(nextRun.getDate() + 1);
          nextRun.setHours(2, 0, 0, 0); // 2 AM
          break;
        case "weekly":
          nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay())); // Next Sunday
          nextRun.setHours(2, 0, 0, 0);
          break;
        case "monthly":
          nextRun.setMonth(nextRun.getMonth() + 1);
          nextRun.setDate(1);
          nextRun.setHours(2, 0, 0, 0);
          break;
      }

      const { data, error } = await supabase
        .from("backup_schedules")
        .insert({
          ...schedule,
          next_run_at: nextRun.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backup_schedules"] });
    },
  });
};

export const useUpdateBackupSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BackupSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from("backup_schedules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backup_schedules"] });
    },
  });
};

export const useDeleteBackupSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("backup_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backup_schedules"] });
    },
  });
};
