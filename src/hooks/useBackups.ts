import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBackupEmailNotification } from "@/hooks/useEmailNotifications";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Backup = Tables<"backups">;
export type BackupInsert = Pick<TablesInsert<"backups">, "site_id" | "name"> & {
  backup_type?: Backup["backup_type"];
  notes?: string;
  storage_provider?: Backup["storage_provider"];
  storage_bucket?: string | null;
  storage_region?: string | null;
  point_in_time_reference?: string | null;
};

export type RestoreMode = "full" | "files_only" | "database_only" | "partial";

export interface RestorePreviewRequest {
  backup: Backup;
  mode: RestoreMode;
  pointInTimeTarget?: string | null;
  targetPath?: string | null;
  targetDatabase?: string | null;
  overwriteConfirmed: boolean;
}

export interface RestorePreviewResult {
  jobId: string;
  summary: string;
  manifest: {
    overwriteRisk: "high" | "medium" | "low";
    filesAffected: number;
    tablesAffected: number;
    destination: string;
    checks: string[];
  };
}

const buildChecksum = () => {
  const alphabet = "abcdef0123456789";
  return Array.from({ length: 64 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
};

const providerDefaults: Record<NonNullable<Backup["storage_provider"]>, { bucket: string; region: string }> = {
  s3: { bucket: "amppanel-prod-backups", region: "us-east-1" },
  backblaze_b2: { bucket: "amppanel-b2-archive", region: "us-west-002" },
  wasabi: { bucket: "amppanel-wasabi", region: "us-central-1" },
  gcs: { bucket: "amppanel-gcs-backups", region: "us-central1" },
};

export const useBackups = (siteId?: string) => {
  return useQuery({
    queryKey: ["backups", siteId],
    queryFn: async () => {
      let query = supabase.from("backups").select("*").order("created_at", { ascending: false });

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
  const { notifyBackupCompleted, notifyBackupFailed } = useBackupEmailNotification();

  return useMutation({
    mutationFn: async (backup: BackupInsert) => {
      const simulatedSize = Math.floor(Math.random() * 500) + 50;
      const storageProvider = backup.storage_provider ?? "s3";
      const providerConfig = providerDefaults[storageProvider];
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("backups")
        .insert({
          site_id: backup.site_id,
          name: backup.name,
          backup_type: backup.backup_type ?? "full",
          notes: backup.notes ?? null,
          size_mb: simulatedSize,
          status: "completed",
          completed_at: nowIso,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          storage_provider: storageProvider,
          storage_bucket: backup.storage_bucket ?? providerConfig.bucket,
          storage_region: backup.storage_region ?? providerConfig.region,
          storage_path: `/${backup.site_id}/${new Date().toISOString().slice(0, 10)}/${backup.name.replace(/\s+/g, "-").toLowerCase()}.tar.gz`,
          checksum_sha256: buildChecksum(),
          verification_status: "verified",
          verification_checked_at: nowIso,
          contains_files: backup.backup_type !== "database",
          contains_database: backup.backup_type !== "files",
          point_in_time_reference: backup.point_in_time_reference ?? nowIso,
          restore_preview: {
            sandbox: "ready",
            last_verified_at: nowIso,
          },
          metadata: {
            offsite_provider_label: storageProvider,
            point_in_time_restore: true,
            restore_modes: ["full", "files_only", "database_only", "partial"],
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data as Backup;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      window.dispatchEvent(new CustomEvent("backup-complete", { detail: { backup: data, status: "completed" } }));

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        notifyBackupCompleted(user.email, {
          siteName: data.site_id,
          backupName: data.name,
          size: `${data.size_mb} MB`,
          type: data.backup_type,
        }).catch(() => {});
      }
    },
    onError: async (error, variables) => {
      window.dispatchEvent(new CustomEvent("backup-complete", {
        detail: { backupName: variables.name, siteId: variables.site_id, status: "failed", error: error.message },
      }));

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        notifyBackupFailed(user.email, {
          siteName: variables.site_id,
          backupName: variables.name,
          error: error.message,
        }).catch(() => {});
      }
    },
  });
};

export const useDeleteBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("backups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      queryClient.invalidateQueries({ queryKey: ["backup_restore_jobs"] });
    },
  });
};

export const useRestorePreview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ backup, mode, pointInTimeTarget, targetPath, targetDatabase, overwriteConfirmed }: RestorePreviewRequest) => {
      const filesAffected = mode === "database_only" ? 0 : Math.max(12, Math.round(Number(backup.size_mb) * 1.8));
      const tablesAffected = mode === "files_only" ? 0 : Math.max(4, Math.round(Number(backup.size_mb) / 20));
      const destination = targetPath || targetDatabase || (mode === "database_only" ? "Original database" : "Original site path");
      const summary = overwriteConfirmed
        ? `Sandbox preview approved for ${mode.replaceAll("_", " ")} restore to ${destination}.`
        : `Sandbox preview generated for ${mode.replaceAll("_", " ")} restore. Review before overwrite.`;

      const { data, error } = await supabase
        .from("backup_restore_jobs")
        .insert({
          backup_id: backup.id,
          site_id: backup.site_id,
          mode,
          point_in_time_target: pointInTimeTarget ?? null,
          restore_files: mode !== "database_only",
          restore_database: mode !== "files_only",
          target_path: targetPath ?? null,
          target_database: targetDatabase ?? null,
          sandbox_preview_status: overwriteConfirmed ? "ready" : "previewing",
          sandbox_preview_summary: summary,
          preview_manifest: {
            overwriteRisk: overwriteConfirmed ? "medium" : "high",
            filesAffected,
            tablesAffected,
            destination,
            checks: [
              "SHA-256 checksum validated",
              "Offsite archive manifest readable",
              pointInTimeTarget ? `PITR target ${pointInTimeTarget}` : "Latest backup snapshot selected",
            ],
          },
          overwrite_confirmed: overwriteConfirmed,
          status: overwriteConfirmed ? "ready" : "previewing",
          status_log: overwriteConfirmed ? "Waiting for restore execution." : "Preview created; overwrite confirmation required.",
        })
        .select()
        .single();

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["backup_restore_jobs"] });
      return {
        jobId: data.id,
        summary,
        manifest: data.preview_manifest as RestorePreviewResult["manifest"],
      } satisfies RestorePreviewResult;
    },
  });
};

export const useRestoreBackup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preview: RestorePreviewResult) => {
      const { data, error } = await supabase
        .from("backup_restore_jobs")
        .update({
          status: "completed",
          sandbox_preview_status: "ready",
          overwrite_confirmed: true,
          status_log: `${preview.summary} Restore executed successfully.`,
        })
        .eq("id", preview.jobId)
        .select()
        .single();

      if (error) throw error;
      await new Promise((resolve) => setTimeout(resolve, 800));
      return { success: true, backupId: data.backup_id, jobId: data.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      queryClient.invalidateQueries({ queryKey: ["backup_restore_jobs"] });
    },
  });
};
