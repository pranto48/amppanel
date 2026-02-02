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
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if default admin already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const adminExists = existingUsers.users.some(
      (user) => user.email === DEFAULT_ADMIN_EMAIL
    );

    if (adminExists) {
      console.log('Default admin already exists');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Default admin already exists',
          credentials: {
            email: DEFAULT_ADMIN_EMAIL,
            password: '(already set)'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create default admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        role: 'admin',
        is_default_admin: true,
      },
    });

    if (createError) {
      console.error('Error creating admin:', createError);
      throw createError;
    }

    console.log('Default admin created successfully:', newUser.user?.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Default admin created successfully',
        credentials: {
          email: DEFAULT_ADMIN_EMAIL,
          password: DEFAULT_ADMIN_PASSWORD
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Setup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to setup default admin'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
