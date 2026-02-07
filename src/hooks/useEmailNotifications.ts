import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type NotificationType = 
  | "backup_completed" 
  | "backup_failed" 
  | "security_alert" 
  | "cron_job_failed" 
  | "site_down" 
  | "ssl_expiring" 
  | "general";

interface SendEmailParams {
  to: string;
  subject?: string;
  type: NotificationType;
  data?: Record<string, any>;
}

export const useSendEmailNotification = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ to, subject, type, data }: SendEmailParams) => {
      const { data: response, error } = await supabase.functions.invoke(
        "send-notification-email",
        {
          body: { to, subject, type, data },
        }
      );

      if (error) throw error;
      if (!response.success) throw new Error(response.error);
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Notification email has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to Send Email",
        description: error.message,
      });
    },
  });
};

// Helper functions for common notification types
export const useBackupEmailNotification = () => {
  const sendEmail = useSendEmailNotification();

  return {
    notifyBackupCompleted: (to: string, data: {
      siteName: string;
      backupName: string;
      size: string;
      type?: string;
    }) => sendEmail.mutateAsync({ to, type: "backup_completed", data }),
    
    notifyBackupFailed: (to: string, data: {
      siteName: string;
      backupName: string;
      error: string;
    }) => sendEmail.mutateAsync({ to, type: "backup_failed", data }),
    
    isPending: sendEmail.isPending,
  };
};

export const useSecurityEmailNotification = () => {
  const sendEmail = useSendEmailNotification();

  return {
    notifySecurityAlert: (to: string, data: {
      alertType: string;
      description: string;
      ipAddress?: string;
    }) => sendEmail.mutateAsync({ to, type: "security_alert", data }),
    
    isPending: sendEmail.isPending,
  };
};

export const useCronJobEmailNotification = () => {
  const sendEmail = useSendEmailNotification();

  return {
    notifyCronJobFailed: (to: string, data: {
      jobName: string;
      schedule: string;
      error: string;
    }) => sendEmail.mutateAsync({ to, type: "cron_job_failed", data }),
    
    isPending: sendEmail.isPending,
  };
};

export const useSiteEmailNotification = () => {
  const sendEmail = useSendEmailNotification();

  return {
    notifySiteDown: (to: string, data: {
      domain: string;
      statusCode?: number;
      responseTime?: string;
    }) => sendEmail.mutateAsync({ to, type: "site_down", data }),
    
    notifySslExpiring: (to: string, data: {
      domain: string;
      expiresAt: string;
      daysRemaining: number;
    }) => sendEmail.mutateAsync({ to, type: "ssl_expiring", data }),
    
    isPending: sendEmail.isPending,
  };
};
