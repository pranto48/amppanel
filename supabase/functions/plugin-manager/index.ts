import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstallRequest {
  action: 'install' | 'uninstall' | 'health_check' | 'get_status';
  plugin_id?: string;
  installed_plugin_id?: string;
  config?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || !['super_admin', 'admin'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: InstallRequest = await req.json();
    const { action, plugin_id, installed_plugin_id, config } = body;

    switch (action) {
      case 'install': {
        if (!plugin_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'plugin_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get plugin details
        const { data: plugin, error: pluginError } = await supabaseAdmin
          .from('plugins')
          .select('*')
          .eq('id', plugin_id)
          .single();

        if (pluginError || !plugin) {
          return new Response(
            JSON.stringify({ success: false, error: 'Plugin not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if already installed
        const { data: existing } = await supabaseAdmin
          .from('installed_plugins')
          .select('id, status')
          .eq('plugin_id', plugin_id)
          .maybeSingle();

        let installedPluginId: string;

        if (existing) {
          // Update existing record
          const { error: updateError } = await supabaseAdmin
            .from('installed_plugins')
            .update({
              status: 'installing',
              config: config || plugin.config_template,
              error_message: null,
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
          installedPluginId = existing.id;
        } else {
          // Create new installed plugin record
          const { data: newInstall, error: insertError } = await supabaseAdmin
            .from('installed_plugins')
            .insert({
              plugin_id,
              status: 'installing',
              config: config || plugin.config_template,
            })
            .select('id')
            .single();

          if (insertError) throw insertError;
          installedPluginId = newInstall.id;
        }

        // Log the installation start
        await supabaseAdmin.from('plugin_installation_logs').insert({
          installed_plugin_id: installedPluginId,
          action: 'Installation started',
          output: `Starting installation of ${plugin.display_name} v${plugin.version}`,
        });

        // Simulate installation process
        // In a real implementation, this would execute actual commands
        const installCommands = [];

        if (plugin.apt_packages && plugin.apt_packages.length > 0) {
          installCommands.push(`apt-get update`);
          installCommands.push(`apt-get install -y ${plugin.apt_packages.join(' ')}`);
        }

        if (plugin.docker_image) {
          installCommands.push(`docker pull ${plugin.docker_image}`);
          installCommands.push(`docker run -d --name ${plugin.name} ${plugin.docker_image}`);
        }

        // Log commands
        for (const cmd of installCommands) {
          await supabaseAdmin.from('plugin_installation_logs').insert({
            installed_plugin_id: installedPluginId,
            action: 'Executing command',
            output: cmd,
          });
        }

        // Simulate successful installation
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update status to installed
        await supabaseAdmin
          .from('installed_plugins')
          .update({
            status: 'installed',
            installed_version: plugin.version,
            installed_at: new Date().toISOString(),
            is_healthy: true,
            last_health_check: new Date().toISOString(),
          })
          .eq('id', installedPluginId);

        await supabaseAdmin.from('plugin_installation_logs').insert({
          installed_plugin_id: installedPluginId,
          action: 'Installation complete',
          output: `Successfully installed ${plugin.display_name}`,
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            installed_plugin_id: installedPluginId,
            message: `${plugin.display_name} installed successfully` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'uninstall': {
        if (!installed_plugin_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'installed_plugin_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get installed plugin with plugin details
        const { data: installedPlugin, error: ipError } = await supabaseAdmin
          .from('installed_plugins')
          .select('*, plugin:plugins(*)')
          .eq('id', installed_plugin_id)
          .single();

        if (ipError || !installedPlugin) {
          return new Response(
            JSON.stringify({ success: false, error: 'Installed plugin not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update status to uninstalling
        await supabaseAdmin
          .from('installed_plugins')
          .update({ status: 'uninstalling' })
          .eq('id', installed_plugin_id);

        await supabaseAdmin.from('plugin_installation_logs').insert({
          installed_plugin_id,
          action: 'Uninstallation started',
          output: `Removing ${installedPlugin.plugin?.display_name}`,
        });

        // Simulate uninstall
        await new Promise(resolve => setTimeout(resolve, 300));

        // Delete the installed plugin record
        await supabaseAdmin
          .from('installed_plugins')
          .delete()
          .eq('id', installed_plugin_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `${installedPlugin.plugin?.display_name} uninstalled successfully` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'health_check': {
        if (!installed_plugin_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'installed_plugin_id is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Simulate health check - in real implementation, would check actual service
        const isHealthy = Math.random() > 0.1; // 90% chance of being healthy

        await supabaseAdmin
          .from('installed_plugins')
          .update({
            is_healthy: isHealthy,
            last_health_check: new Date().toISOString(),
          })
          .eq('id', installed_plugin_id);

        return new Response(
          JSON.stringify({ success: true, is_healthy: isHealthy }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_status': {
        const { data: installedPlugins, error } = await supabaseAdmin
          .from('installed_plugins')
          .select('*, plugin:plugins(*)')
          .order('installed_at', { ascending: false });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, plugins: installedPlugins }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Plugin Manager Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
