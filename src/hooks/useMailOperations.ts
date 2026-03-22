import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MailDomainSettings {
  id: string;
  site_id: string;
  dkim_selector: string;
  dkim_public_key: string | null;
  dkim_private_key_hint: string | null;
  dkim_last_rotated_at: string | null;
  spf_policy: string;
  dmarc_policy: string;
  spam_filter_provider: string;
  spam_filter_enabled: boolean;
  spam_threshold: number;
  quarantine_enabled: boolean;
  smtp_relay_enabled: boolean;
  smtp_relay_host: string | null;
  smtp_relay_port: number | null;
  smtp_relay_username: string | null;
  smtp_relay_password_hint: string | null;
  webmail_provider: string;
  webmail_url: string | null;
}

export interface MailQueueMessage {
  id: string;
  site_id: string;
  queue_id: string;
  message_id: string;
  sender: string;
  recipient: string;
  subject: string;
  status: "queued" | "deferred" | "delivered" | "bounced" | "held";
  size_bytes: number;
  attempt_count: number;
  last_attempt_at: string | null;
  next_attempt_at: string | null;
  reason: string | null;
  created_at: string;
}

export interface MailQuarantineMessage {
  id: string;
  site_id: string;
  sender: string;
  subject: string;
  spam_score: number;
  detection_summary: string | null;
  released_at: string | null;
  created_at: string;
}

export interface MailSmtpLog {
  id: string;
  site_id: string;
  direction: string;
  status: string;
  sender: string;
  recipient: string;
  remote_host: string | null;
  queue_id: string | null;
  message_id: string | null;
  response: string | null;
  logged_at: string;
}

export interface MailDeliverabilityCheck {
  id: string;
  site_id: string;
  status: "healthy" | "warning" | "critical";
  score: number;
  blacklist_hits: string[];
  dns_warnings: string[];
  summary: string | null;
  checked_at: string;
}

export interface MailDkimRotation {
  id: string;
  site_id: string;
  selector: string;
  public_key: string;
  dns_name: string;
  dns_value: string;
  status: "active" | "rotating" | "revoked";
  rotated_at: string;
}

export interface MailboxUsageSnapshot {
  id: string;
  email_account_id: string;
  used_mb: number;
  message_count: number;
  spam_count: number;
  recorded_at: string;
}

export interface MailBounceDiagnostic {
  id: string;
  site_id: string;
  recipient: string;
  status: string;
  bounce_class: string;
  diagnostic_code: string | null;
  recommended_action: string | null;
  created_at: string;
}

export function useMailDomainSettings(siteId?: string) {
  return useQuery({
    queryKey: ["mail-domain-settings", siteId],
    enabled: !!siteId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("mail_domain_settings").select("*").eq("site_id", siteId).maybeSingle();
      if (error) throw error;
      return (data ?? null) as MailDomainSettings | null;
    },
  });
}

function createSiteScopedQuery<T>(key: string, table: string, siteId?: string, orderColumn = "created_at") {
  return useQuery({
    queryKey: [key, siteId],
    enabled: !!siteId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from(table).select("*").eq("site_id", siteId).order(orderColumn, { ascending: false });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export const useMailQueue = (siteId?: string) => createSiteScopedQuery<MailQueueMessage>("mail-queue", "mail_queue_messages", siteId);
export const useMailQuarantine = (siteId?: string) => createSiteScopedQuery<MailQuarantineMessage>("mail-quarantine", "mail_quarantine_messages", siteId);
export const useMailSmtpLogs = (siteId?: string) => createSiteScopedQuery<MailSmtpLog>("mail-smtp-logs", "mail_smtp_logs", siteId, "logged_at");
export const useMailDeliverabilityChecks = (siteId?: string) => createSiteScopedQuery<MailDeliverabilityCheck>("mail-deliverability", "mail_deliverability_checks", siteId, "checked_at");
export const useMailDkimRotations = (siteId?: string) => createSiteScopedQuery<MailDkimRotation>("mail-dkim-rotations", "mail_dkim_rotations", siteId, "rotated_at");
export const useMailBounceDiagnostics = (siteId?: string) => createSiteScopedQuery<MailBounceDiagnostic>("mail-bounces", "mail_bounce_diagnostics", siteId);

export function useMailboxUsageSnapshots(accountIds: string[]) {
  return useQuery({
    queryKey: ["mailbox-usage", accountIds],
    enabled: accountIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("mailbox_usage_snapshots").select("*").in("email_account_id", accountIds).order("recorded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MailboxUsageSnapshot[];
    },
  });
}

function createMailOpMutation(action: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("mail-ops", { body: { action, ...body } });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      const siteId = variables.site_id as string | undefined;
      queryClient.invalidateQueries({ queryKey: ["mail-domain-settings", siteId] });
      queryClient.invalidateQueries({ queryKey: ["mail-queue", siteId] });
      queryClient.invalidateQueries({ queryKey: ["mail-quarantine", siteId] });
      queryClient.invalidateQueries({ queryKey: ["mail-smtp-logs", siteId] });
      queryClient.invalidateQueries({ queryKey: ["mail-deliverability", siteId] });
      queryClient.invalidateQueries({ queryKey: ["mail-dkim-rotations", siteId] });
      queryClient.invalidateQueries({ queryKey: ["mail-bounces", siteId] });
    },
  });
}

export const useSaveMailSettings = () => createMailOpMutation("save_settings");
export const useGenerateDkim = () => createMailOpMutation("generate_dkim");
export const useRotateDkim = () => createMailOpMutation("rotate_dkim");
export const useRunMailDeliverabilityCheck = () => createMailOpMutation("run_deliverability_check");
export const useRetryMailQueueMessage = () => createMailOpMutation("retry_queue");
export const usePurgeMailQueueMessage = () => createMailOpMutation("purge_queue");
export const useReleaseQuarantineMessage = () => createMailOpMutation("release_quarantine");
