import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PluginCategory = 'web_server' | 'email' | 'ftp' | 'dns' | 'backup' | 'database' | 'file_manager' | 'security' | 'monitoring' | 'other';
export type PluginStatus = 'available' | 'installing' | 'installed' | 'failed' | 'uninstalling';

export interface Plugin {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  version: string;
  category: PluginCategory;
  icon: string | null;
  author: string | null;
  is_core: boolean;
  docker_image: string | null;
  apt_packages: string[] | null;
  config_template: Record<string, unknown>;
  dependencies: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface InstalledPlugin {
  id: string;
  plugin_id: string;
  status: PluginStatus;
  config: Record<string, unknown>;
  installed_version: string | null;
  installed_at: string | null;
  last_health_check: string | null;
  is_healthy: boolean | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  plugin?: Plugin;
}

export interface PluginInstallationLog {
  id: string;
  installed_plugin_id: string;
  action: string;
  output: string | null;
  is_error: boolean;
  created_at: string;
}

export function usePlugins(category?: PluginCategory) {
  return useQuery({
    queryKey: ['plugins', category],
    queryFn: async () => {
      let query = supabase
        .from('plugins')
        .select('*')
        .order('is_core', { ascending: false })
        .order('display_name');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Plugin[];
    },
  });
}

export function useInstalledPlugins() {
  return useQuery({
    queryKey: ['installed_plugins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('installed_plugins')
        .select(`
          *,
          plugin:plugins(*)
        `)
        .order('installed_at', { ascending: false });
      
      if (error) throw error;
      return data as InstalledPlugin[];
    },
  });
}

export function usePluginInstallationLogs(installedPluginId: string) {
  return useQuery({
    queryKey: ['plugin_logs', installedPluginId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plugin_installation_logs')
        .select('*')
        .eq('installed_plugin_id', installedPluginId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PluginInstallationLog[];
    },
    enabled: !!installedPluginId,
  });
}

export function useInstallPlugin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ pluginId, config }: { pluginId: string; config?: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('plugin-manager', {
        body: { action: 'install', plugin_id: pluginId, config },
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Installation failed');
      return data;
    },
    onSuccess: (_, { pluginId }) => {
      queryClient.invalidateQueries({ queryKey: ['installed_plugins'] });
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      toast({
        title: "Plugin Installing",
        description: "The plugin installation has started. Check the logs for progress.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Installation Failed",
        description: error.message,
      });
    },
  });
}

export function useUninstallPlugin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (installedPluginId: string) => {
      const { data, error } = await supabase.functions.invoke('plugin-manager', {
        body: { action: 'uninstall', installed_plugin_id: installedPluginId },
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Uninstallation failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installed_plugins'] });
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      toast({
        title: "Plugin Uninstalling",
        description: "The plugin is being removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Uninstallation Failed",
        description: error.message,
      });
    },
  });
}

export function usePluginHealthCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (installedPluginId: string) => {
      const { data, error } = await supabase.functions.invoke('plugin-manager', {
        body: { action: 'health_check', installed_plugin_id: installedPluginId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installed_plugins'] });
    },
  });
}
