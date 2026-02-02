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

        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name || '' },
        });

        if (createError) throw createError;

        // Update profile with full_name
        if (full_name && newUser.user) {
          await supabaseAdmin
            .from('profiles')
            .update({ full_name })
            .eq('id', newUser.user.id);
        }

        // Update role if specified and not default 'user'
        if (role && role !== 'user' && newUser.user) {
          await supabaseAdmin
            .from('user_roles')
            .update({ role })
            .eq('user_id', newUser.user.id);
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

        const adminExists = existingUsers.users.some(
          (user) => user.email === DEFAULT_ADMIN_EMAIL
        );

        if (adminExists) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Default admin already exists',
              credentials: { email: DEFAULT_ADMIN_EMAIL, password: '(already set)' }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: DEFAULT_ADMIN_EMAIL,
          password: DEFAULT_ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { role: 'admin', is_default_admin: true },
        });

        if (createError) throw createError;

        // Assign super_admin role
        if (newUser.user) {
          await supabaseAdmin
            .from('user_roles')
            .update({ role: 'super_admin' })
            .eq('user_id', newUser.user.id);
        }

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
