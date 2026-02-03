-- Create plugin status enum
CREATE TYPE public.plugin_status AS ENUM ('available', 'installing', 'installed', 'failed', 'uninstalling');

-- Create plugin category enum
CREATE TYPE public.plugin_category AS ENUM ('web_server', 'email', 'ftp', 'dns', 'backup', 'database', 'file_manager', 'security', 'monitoring', 'other');

-- Create plugins table (marketplace catalog)
CREATE TABLE public.plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  category public.plugin_category NOT NULL DEFAULT 'other',
  icon TEXT,
  author TEXT DEFAULT 'AMP Panel',
  is_core BOOLEAN NOT NULL DEFAULT false,
  docker_image TEXT,
  apt_packages TEXT[],
  config_template JSONB DEFAULT '{}',
  dependencies TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create installed plugins table
CREATE TABLE public.installed_plugins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plugin_id UUID NOT NULL REFERENCES public.plugins(id) ON DELETE CASCADE,
  status public.plugin_status NOT NULL DEFAULT 'available',
  config JSONB DEFAULT '{}',
  installed_version TEXT,
  installed_at TIMESTAMP WITH TIME ZONE,
  last_health_check TIMESTAMP WITH TIME ZONE,
  is_healthy BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plugin_id)
);

-- Create installation logs table
CREATE TABLE public.plugin_installation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  installed_plugin_id UUID NOT NULL REFERENCES public.installed_plugins(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  output TEXT,
  is_error BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system settings table for app configuration
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installed_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_installation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Plugins are viewable by all authenticated users
CREATE POLICY "Authenticated users can view plugins"
ON public.plugins FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only super_admin/admin can manage plugins catalog
CREATE POLICY "Admins can manage plugins"
ON public.plugins FOR ALL
USING (is_admin(auth.uid()));

-- Installed plugins viewable by authenticated users
CREATE POLICY "Authenticated users can view installed plugins"
ON public.installed_plugins FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can install/uninstall plugins
CREATE POLICY "Admins can manage installed plugins"
ON public.installed_plugins FOR ALL
USING (is_admin(auth.uid()));

-- Installation logs viewable by admins
CREATE POLICY "Admins can view installation logs"
ON public.plugin_installation_logs FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can insert logs
CREATE POLICY "Admins can insert installation logs"
ON public.plugin_installation_logs FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- System settings viewable by authenticated users
CREATE POLICY "Authenticated users can view system settings"
ON public.system_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only super_admin can manage system settings
CREATE POLICY "Super admins can manage system settings"
ON public.system_settings FOR ALL
USING (has_app_role(auth.uid(), 'super_admin'));

-- Add updated_at triggers
CREATE TRIGGER update_plugins_updated_at
BEFORE UPDATE ON public.plugins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installed_plugins_updated_at
BEFORE UPDATE ON public.installed_plugins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();