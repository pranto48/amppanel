import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Backup {
  id: string;
  site_id: string;
  name: string;
  backup_type: "full" | "files" | "database" | "scheduled";
  status: "pending" | "in_progress" | "completed" | "failed";
  size_mb: number;
  file_path: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export interface BackupInsert {
  site_id: string;
  name: string;
  backup_type?: Backup["backup_type"];
  notes?: string;
}

export const useBackups = (siteId?: string) => {
  return useQuery({
    queryKey: ["backups", siteId],
    queryFn: async () => {
      let query = supabase
        .from("backups")
        .select("*")
        .order("created_at", { ascending: false });

      if (siteId) {
        query = query.eq("site_id", siteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Backup[];
    },
  });
};

export const useCreateBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backup: BackupInsert) => {
      // Simulate backup creation with random size
      const simulatedSize = Math.floor(Math.random() * 500) + 50;
      
      const { data, error } = await supabase
        .from("backups")
        .insert({
          ...backup,
          size_mb: simulatedSize,
          status: "completed" as const,
          completed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });
};

export const useDeleteBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("backups")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });
};

export const useRestoreBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Simulate restore - in a real app, this would trigger a restore process
      // For now, just return success after a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { success: true, backupId: id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
    },
  });
};
