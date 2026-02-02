import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailAccount {
  id: string;
  site_id: string;
  email: string;
  quota_mb: number;
  used_mb: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailForwarder {
  id: string;
  site_id: string;
  source_email: string;
  destination_emails: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailAutoresponder {
  id: string;
  email_account_id: string;
  subject: string;
  body: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// Email Accounts
export const useEmailAccounts = (siteId?: string) => {
  return useQuery({
    queryKey: ["email-accounts", siteId],
    queryFn: async () => {
      let query = supabase.from("email_accounts").select("*").order("created_at", { ascending: false });
      if (siteId) query = query.eq("site_id", siteId);
      const { data, error } = await query;
      if (error) throw error;
      return data as EmailAccount[];
    },
  });
};

export const useCreateEmailAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (account: { site_id: string; email: string; password_hash?: string; quota_mb?: number }) => {
      const { data, error } = await supabase.from("email_accounts").insert(account).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-accounts"] }),
  });
};

export const useUpdateEmailAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailAccount> & { id: string }) => {
      const { data, error } = await supabase.from("email_accounts").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-accounts"] }),
  });
};

export const useDeleteEmailAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-accounts"] }),
  });
};

// Forwarders
export const useEmailForwarders = (siteId?: string) => {
  return useQuery({
    queryKey: ["email-forwarders", siteId],
    queryFn: async () => {
      let query = supabase.from("email_forwarders").select("*").order("created_at", { ascending: false });
      if (siteId) query = query.eq("site_id", siteId);
      const { data, error } = await query;
      if (error) throw error;
      return data as EmailForwarder[];
    },
  });
};

export const useCreateEmailForwarder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (forwarder: { site_id: string; source_email: string; destination_emails: string[] }) => {
      const { data, error } = await supabase.from("email_forwarders").insert(forwarder).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-forwarders"] }),
  });
};

export const useUpdateEmailForwarder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailForwarder> & { id: string }) => {
      const { data, error } = await supabase.from("email_forwarders").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-forwarders"] }),
  });
};

export const useDeleteEmailForwarder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_forwarders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-forwarders"] }),
  });
};

// Autoresponders
export const useEmailAutoresponders = (emailAccountId?: string) => {
  return useQuery({
    queryKey: ["email-autoresponders", emailAccountId],
    queryFn: async () => {
      let query = supabase.from("email_autoresponders").select("*").order("created_at", { ascending: false });
      if (emailAccountId) query = query.eq("email_account_id", emailAccountId);
      const { data, error } = await query;
      if (error) throw error;
      return data as EmailAutoresponder[];
    },
  });
};

export const useCreateEmailAutoresponder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (autoresponder: { email_account_id: string; subject: string; body: string; start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase.from("email_autoresponders").insert(autoresponder).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-autoresponders"] }),
  });
};

export const useUpdateEmailAutoresponder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailAutoresponder> & { id: string }) => {
      const { data, error } = await supabase.from("email_autoresponders").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-autoresponders"] }),
  });
};

export const useDeleteEmailAutoresponder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_autoresponders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["email-autoresponders"] }),
  });
};
