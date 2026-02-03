import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface SystemSetting {
  id: string;
  key: string;
  value: Json;
  created_at: string;
  updated_at: string;
}

export function useSystemSetting(key: string) {
  return useQuery({
    queryKey: ['system_settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', key)
        .maybeSingle();
      
      if (error) throw error;
      return data as SystemSetting | null;
    },
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) throw error;
      return data as SystemSetting[];
    },
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      // Try to update first
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert([{ key, value }]);
        if (error) throw error;
      }
    },
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      queryClient.invalidateQueries({ queryKey: ['system_settings', key] });
      toast({
        title: "Settings Updated",
        description: "System settings have been saved.",
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
}

export function useIsAdminSetupComplete() {
  return useQuery({
    queryKey: ['admin_setup_complete'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'admin_setup_complete')
        .maybeSingle();
      
      if (error) throw error;
      
      // Safely check for completed property
      if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
        return (data.value as Record<string, unknown>).completed === true;
      }
      return false;
    },
  });
}
