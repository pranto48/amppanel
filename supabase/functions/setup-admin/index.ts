import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_ADMIN_EMAIL = "admin_amp@localhost";
const DEFAULT_ADMIN_PASSWORD = "Amp_Password";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body = await req.json().catch(() => ({}));
    const { action, user_id, email, password, full_name, role } = body;

    // Handle different actions
    switch (action) {
      case 'create_user': {
        if (!email || !password) {
          return new Response(
            JSON.stringify({ error: 'Email and password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if user already exists
        const { data: existingList } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingList?.users?.find((u) => u.email === email);
        if (existingUser) {
          return new Response(
            JSON.stringify({ error: `A user with email "${email}" already exists` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name || '' },
        });

        if (createError) throw createError;

        // Create profile manually in case trigger doesn't fire
        if (newUser.user) {
          await supabaseAdmin
            .from('profiles')
            .upsert({ id: newUser.user.id, email, full_name: full_name || '' }, { onConflict: 'id' });
        }

        // Update role if specified and not default 'user'
        if (role && role !== 'user' && newUser.user) {
          await supabaseAdmin.from('user_roles').delete().eq('user_id', newUser.user.id);
          await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role });
        }

        return new Response(
          JSON.stringify({ success: true, user: newUser.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_user': {
        if (!user_id) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
        if (deleteError) throw deleteError;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_role': {
        if (!user_id || !role) {
          return new Response(
            JSON.stringify({ error: 'User ID and role are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete existing role and insert new one
        await supabaseAdmin.from('user_roles').delete().eq('user_id', user_id);
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id, role });

        if (roleError) throw roleError;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default: {
        // Original setup admin logic
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) throw listError;

        // Always recreate admin to ensure clean state
        // Delete existing admin user and recreate to ensure clean state
        const existingAdmin = existingUsers.users.find(
          (user) => user.email === DEFAULT_ADMIN_EMAIL
        );
        if (existingAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(existingAdmin.id);
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: DEFAULT_ADMIN_EMAIL,
          password: DEFAULT_ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { role: 'admin', is_default_admin: true, full_name: 'Admin' },
        });

        if (createError) throw createError;

        // Create profile and role manually (trigger may not fire for admin API)
        if (newUser.user) {
          await supabaseAdmin
            .from('profiles')
            .upsert({ id: newUser.user.id, email: DEFAULT_ADMIN_EMAIL, full_name: 'Admin' }, { onConflict: 'id' });

          // Delete default role from trigger, then insert super_admin
          await supabaseAdmin.from('user_roles').delete().eq('user_id', newUser.user.id);
          await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role: 'super_admin' });
        }

        // Mark admin setup as complete
        await supabaseAdmin
          .from('system_settings')
          .upsert({ 
            key: 'admin_setup_complete', 
            value: { completed: true, completed_at: new Date().toISOString() }
          }, { onConflict: 'key' });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Default admin created successfully',
            credentials: { email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
