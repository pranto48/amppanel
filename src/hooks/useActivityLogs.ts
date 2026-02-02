import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ActivityType =
  | "login"
  | "logout"
  | "site_created"
  | "site_updated"
  | "site_deleted"
  | "database_created"
  | "database_deleted"
  | "backup_created"
  | "backup_restored"
  | "backup_deleted"
  | "file_uploaded"
  | "file_deleted"
  | "file_modified"
  | "user_invited"
  | "user_removed"
  | "role_changed"
  | "settings_updated"
  | "password_changed"
  | "security_alert";

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  site_id: string | null;
  created_at: string;
}

export interface CreateActivityLogParams {
  activity_type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  site_id?: string;
}

export const useActivityLogs = (options?: {
  limit?: number;
  siteId?: string;
  activityType?: ActivityType;
}) => {
  const { limit = 50, siteId, activityType } = options || {};

  return useQuery({
    queryKey: ["activity_logs", { limit, siteId, activityType }],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (siteId) {
        query = query.eq("site_id", siteId);
      }

      if (activityType) {
        query = query.eq("activity_type", activityType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ActivityLog[];
    },
  });
};

export const useCreateActivityLog = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: CreateActivityLogParams) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("activity_logs")
        .insert({
          user_id: user.id,
          activity_type: params.activity_type,
          title: params.title,
          description: params.description || null,
          metadata: params.metadata || {},
          site_id: params.site_id || null,
          user_agent: navigator.userAgent,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
};

// Helper hook for logging common actions
export const useLogActivity = () => {
  const createLog = useCreateActivityLog();

  const logLogin = () => {
    createLog.mutate({
      activity_type: "login",
      title: "Signed in",
      description: "User successfully signed in to the panel",
    });
  };

  const logLogout = () => {
    createLog.mutate({
      activity_type: "logout",
      title: "Signed out",
      description: "User signed out of the panel",
    });
  };

  const logSiteCreated = (domain: string, siteId: string) => {
    createLog.mutate({
      activity_type: "site_created",
      title: `Created site ${domain}`,
      description: `New website "${domain}" was created`,
      site_id: siteId,
      metadata: { domain },
    });
  };

  const logSiteUpdated = (domain: string, siteId: string, changes?: Record<string, any>) => {
    createLog.mutate({
      activity_type: "site_updated",
      title: `Updated site ${domain}`,
      description: `Website "${domain}" configuration was updated`,
      site_id: siteId,
      metadata: { domain, changes },
    });
  };

  const logSiteDeleted = (domain: string) => {
    createLog.mutate({
      activity_type: "site_deleted",
      title: `Deleted site ${domain}`,
      description: `Website "${domain}" was permanently deleted`,
      metadata: { domain },
    });
  };

  const logDatabaseCreated = (dbName: string, siteId: string) => {
    createLog.mutate({
      activity_type: "database_created",
      title: `Created database ${dbName}`,
      description: `New database "${dbName}" was created`,
      site_id: siteId,
      metadata: { database: dbName },
    });
  };

  const logDatabaseDeleted = (dbName: string, siteId: string) => {
    createLog.mutate({
      activity_type: "database_deleted",
      title: `Deleted database ${dbName}`,
      description: `Database "${dbName}" was permanently deleted`,
      site_id: siteId,
      metadata: { database: dbName },
    });
  };

  const logBackupCreated = (backupName: string, siteId: string, backupType: string) => {
    createLog.mutate({
      activity_type: "backup_created",
      title: `Created ${backupType} backup`,
      description: `Backup "${backupName}" was created`,
      site_id: siteId,
      metadata: { backup: backupName, type: backupType },
    });
  };

  const logBackupRestored = (backupName: string, siteId: string) => {
    createLog.mutate({
      activity_type: "backup_restored",
      title: `Restored backup ${backupName}`,
      description: `Backup "${backupName}" was restored`,
      site_id: siteId,
      metadata: { backup: backupName },
    });
  };

  const logFileUploaded = (fileName: string, siteId?: string) => {
    createLog.mutate({
      activity_type: "file_uploaded",
      title: `Uploaded file ${fileName}`,
      description: `File "${fileName}" was uploaded`,
      site_id: siteId,
      metadata: { file: fileName },
    });
  };

  const logFileDeleted = (fileName: string, siteId?: string) => {
    createLog.mutate({
      activity_type: "file_deleted",
      title: `Deleted file ${fileName}`,
      description: `File "${fileName}" was deleted`,
      site_id: siteId,
      metadata: { file: fileName },
    });
  };

  const logUserInvited = (email: string, role: string, siteId: string) => {
    createLog.mutate({
      activity_type: "user_invited",
      title: `Invited ${email}`,
      description: `Invited "${email}" as ${role}`,
      site_id: siteId,
      metadata: { email, role },
    });
  };

  const logUserRemoved = (userId: string, siteId: string) => {
    createLog.mutate({
      activity_type: "user_removed",
      title: "Removed team member",
      description: "A team member was removed from the site",
      site_id: siteId,
      metadata: { removed_user_id: userId },
    });
  };

  const logRoleChanged = (userId: string, newRole: string, siteId: string) => {
    createLog.mutate({
      activity_type: "role_changed",
      title: `Changed role to ${newRole}`,
      description: `A team member's role was changed to ${newRole}`,
      site_id: siteId,
      metadata: { user_id: userId, new_role: newRole },
    });
  };

  const logPasswordChanged = () => {
    createLog.mutate({
      activity_type: "password_changed",
      title: "Password changed",
      description: "Account password was updated",
    });
  };

  const logSettingsUpdated = (settingName: string) => {
    createLog.mutate({
      activity_type: "settings_updated",
      title: `Updated ${settingName}`,
      description: `${settingName} settings were updated`,
      metadata: { setting: settingName },
    });
  };

  const logSecurityAlert = (alertType: string, details: string) => {
    createLog.mutate({
      activity_type: "security_alert",
      title: alertType,
      description: details,
      metadata: { alert_type: alertType },
    });
  };

  return {
    logLogin,
    logLogout,
    logSiteCreated,
    logSiteUpdated,
    logSiteDeleted,
    logDatabaseCreated,
    logDatabaseDeleted,
    logBackupCreated,
    logBackupRestored,
    logFileUploaded,
    logFileDeleted,
    logUserInvited,
    logUserRemoved,
    logRoleChanged,
    logPasswordChanged,
    logSettingsUpdated,
    logSecurityAlert,
  };
};
