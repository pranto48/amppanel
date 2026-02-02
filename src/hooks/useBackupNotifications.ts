import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface BackupNotification {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  backupId?: string;
  siteId?: string;
  siteDomain?: string;
  timestamp: Date;
  read: boolean;
}

export const useBackupNotifications = () => {
  const [notifications, setNotifications] = useState<BackupNotification[]>([]);
  const { toast } = useToast();

  const addNotification = useCallback((notification: Omit<BackupNotification, "id" | "timestamp" | "read">) => {
    const newNotification: BackupNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50 notifications
    
    // Show toast immediately
    toast({
      variant: notification.type === "error" ? "destructive" : "default",
      title: notification.title,
      description: notification.message,
    });
    
    return newNotification;
  }, [toast]);

  const notifyBackupComplete = useCallback((backupName: string, siteDomain: string, backupId?: string, siteId?: string) => {
    return addNotification({
      type: "success",
      title: "Backup Completed",
      message: `Backup "${backupName}" for ${siteDomain} completed successfully.`,
      backupId,
      siteId,
      siteDomain,
    });
  }, [addNotification]);

  const notifyBackupFailed = useCallback((backupName: string, siteDomain: string, error?: string, backupId?: string, siteId?: string) => {
    return addNotification({
      type: "error",
      title: "Backup Failed",
      message: error ? `Backup "${backupName}" for ${siteDomain} failed: ${error}` : `Backup "${backupName}" for ${siteDomain} failed.`,
      backupId,
      siteId,
      siteDomain,
    });
  }, [addNotification]);

  const notifyBackupStarted = useCallback((backupName: string, siteDomain: string, backupId?: string, siteId?: string) => {
    return addNotification({
      type: "info",
      title: "Backup Started",
      message: `Backup "${backupName}" for ${siteDomain} has started.`,
      backupId,
      siteId,
      siteDomain,
    });
  }, [addNotification]);

  const notifyScheduledBackup = useCallback((scheduleName: string, siteDomain: string, nextRun: string) => {
    return addNotification({
      type: "info",
      title: "Scheduled Backup Created",
      message: `Schedule "${scheduleName}" for ${siteDomain} will run ${nextRun}.`,
      siteDomain,
    });
  }, [addNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Send email notification (requires edge function)
  const sendEmailNotification = useCallback(async (
    email: string,
    subject: string,
    message: string,
    type: "success" | "error"
  ) => {
    try {
      const { error } = await supabase.functions.invoke("backup-notification", {
        body: { email, subject, message, type },
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Failed to send email notification:", err);
      return false;
    }
  }, []);

  return {
    notifications,
    unreadCount,
    notifyBackupComplete,
    notifyBackupFailed,
    notifyBackupStarted,
    notifyScheduledBackup,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    sendEmailNotification,
  };
};
