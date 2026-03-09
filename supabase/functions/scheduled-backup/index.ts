import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const getBackupEmailHtml = (success: boolean, data: Record<string, string>) => {
  const styles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { color: white; padding: 30px; border-radius: 12px 12px 0 0; }
      .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
      .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; }
      .alert { padding: 15px; margin: 15px 0; border-radius: 6px; }
      .details table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; }
      .details td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
      .details td:first-child { font-weight: 600; color: #64748b; width: 40%; }
    </style>
  `;

  if (success) {
    return `${styles}
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #22c55e, #16a34a);">
          <h1 style="margin:0;">✅ Backup Completed</h1>
        </div>
        <div class="content">
          <div class="alert" style="border-left: 4px solid #22c55e; background: #f0fdf4;">
            <strong>Great news!</strong> Your scheduled backup completed successfully.
          </div>
          <div class="details"><table>
            <tr><td>Site</td><td>${data.siteName || 'N/A'}</td></tr>
            <tr><td>Backup Name</td><td>${data.backupName || 'N/A'}</td></tr>
            <tr><td>Size</td><td>${data.size || 'N/A'}</td></tr>
            <tr><td>Schedule</td><td>${data.scheduleName || 'N/A'}</td></tr>
            <tr><td>Next Run</td><td>${data.nextRun || 'N/A'}</td></tr>
            <tr><td>Completed At</td><td>${data.completedAt || new Date().toISOString()}</td></tr>
          </table></div>
        </div>
        <div class="footer"><p>AMP Panel - Server Management Made Simple</p></div>
      </div>`;
  }

  return `${styles}
    <div class="container">
      <div class="header" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
        <h1 style="margin:0;">❌ Backup Failed</h1>
      </div>
      <div class="content">
        <div class="alert" style="border-left: 4px solid #ef4444; background: #fef2f2;">
          <strong>Attention Required!</strong> A scheduled backup has failed.
        </div>
        <div class="details"><table>
          <tr><td>Site</td><td>${data.siteName || 'N/A'}</td></tr>
          <tr><td>Schedule</td><td>${data.scheduleName || 'N/A'}</td></tr>
          <tr><td>Error</td><td>${data.error || 'Unknown error'}</td></tr>
          <tr><td>Failed At</td><td>${data.failedAt || new Date().toISOString()}</td></tr>
        </table></div>
        <p>Please check your server configuration and logs for more details.</p>
      </div>
      <div class="footer"><p>AMP Panel - Server Management Made Simple</p></div>
    </div>`;
};

async function sendBackupEmail(
  resend: InstanceType<typeof Resend> | null,
  to: string,
  success: boolean,
  data: Record<string, string>
) {
  if (!resend || !to) return;
  
  try {
    const subject = success
      ? `✅ Backup Completed: ${data.siteName || 'Your Site'}`
      : `❌ Backup Failed: ${data.siteName || 'Your Site'}`;

    await resend.emails.send({
      from: 'AMP Panel <notifications@resend.dev>',
      to: [to],
      subject,
      html: getBackupEmailHtml(success, data),
    });
    console.log(`Backup ${success ? 'success' : 'failure'} email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send backup email:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Initialize Resend if API key is available
    const resend = resendApiKey ? new Resend(resendApiKey) : null;
    if (!resend) {
      console.warn('RESEND_API_KEY not configured - email notifications will be skipped');
    }

    const now = new Date();
    console.log(`Running scheduled backup job at ${now.toISOString()}`);

    // Get admin email for notifications
    let adminEmail: string | null = null;
    const { data: notifSetting } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'notification_email')
      .maybeSingle();
    
    if (notifSetting?.value && typeof notifSetting.value === 'object') {
      adminEmail = (notifSetting.value as Record<string, string>).email || null;
    }

    // Fallback: get super_admin email from profiles
    if (!adminEmail) {
      const { data: adminRole } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin')
        .limit(1)
        .maybeSingle();

      if (adminRole) {
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', adminRole.user_id)
          .maybeSingle();
        adminEmail = adminProfile?.email || null;
      }
    }

    // Get all enabled schedules that are due
    const { data: dueSchedules, error: fetchError } = await supabaseAdmin
      .from('backup_schedules')
      .select('*, sites(domain)')
      .eq('is_enabled', true)
      .lte('next_run_at', now.toISOString());

    if (fetchError) {
      console.error('Error fetching schedules:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueSchedules?.length || 0} schedules due for backup`);

    const results = [];

    for (const schedule of dueSchedules || []) {
      const siteDomain = (schedule as any).sites?.domain || 'Unknown site';

      try {
        // Create a backup
        const simulatedSize = Math.floor(Math.random() * 500) + 50;
        
        const { data: backup, error: backupError } = await supabaseAdmin
          .from('backups')
          .insert({
            site_id: schedule.site_id,
            name: `Scheduled: ${schedule.name} - ${now.toISOString().split('T')[0]}`,
            backup_type: 'scheduled',
            status: 'completed',
            size_mb: simulatedSize,
            completed_at: now.toISOString(),
            expires_at: new Date(now.getTime() + schedule.retention_days * 24 * 60 * 60 * 1000).toISOString(),
            notes: `Automated backup from schedule: ${schedule.name}`,
          })
          .select()
          .single();

        if (backupError) {
          console.error(`Error creating backup for schedule ${schedule.id}:`, backupError);
          
          // Send failure email
          if (adminEmail) {
            await sendBackupEmail(resend, adminEmail, false, {
              siteName: siteDomain,
              scheduleName: schedule.name,
              error: backupError.message,
              failedAt: now.toISOString(),
            });
          }

          results.push({ schedule_id: schedule.id, success: false, error: backupError.message });
          continue;
        }

        // Calculate next run time
        let nextRun = new Date(now);
        switch (schedule.frequency) {
          case 'daily':
            nextRun.setDate(nextRun.getDate() + 1);
            nextRun.setHours(2, 0, 0, 0);
            break;
          case 'weekly':
            nextRun.setDate(nextRun.getDate() + 7);
            nextRun.setHours(2, 0, 0, 0);
            break;
          case 'monthly':
            nextRun.setMonth(nextRun.getMonth() + 1);
            nextRun.setHours(2, 0, 0, 0);
            break;
        }

        // Update schedule
        const { error: updateError } = await supabaseAdmin
          .from('backup_schedules')
          .update({
            last_run_at: now.toISOString(),
            next_run_at: nextRun.toISOString(),
          })
          .eq('id', schedule.id);

        if (updateError) {
          console.error(`Error updating schedule ${schedule.id}:`, updateError);
        }

        // Clean up old backups
        const retentionCutoff = new Date(now.getTime() - schedule.retention_days * 24 * 60 * 60 * 1000);
        await supabaseAdmin
          .from('backups')
          .delete()
          .eq('site_id', schedule.site_id)
          .eq('backup_type', 'scheduled')
          .lt('created_at', retentionCutoff.toISOString());

        // Send success email
        if (adminEmail) {
          await sendBackupEmail(resend, adminEmail, true, {
            siteName: siteDomain,
            backupName: backup.name,
            size: `${simulatedSize} MB`,
            scheduleName: schedule.name,
            nextRun: nextRun.toISOString(),
            completedAt: now.toISOString(),
          });
        }

        results.push({ 
          schedule_id: schedule.id, 
          success: true, 
          backup_id: backup.id,
          next_run: nextRun.toISOString(),
          email_sent: !!adminEmail,
        });

        console.log(`Successfully created backup for schedule ${schedule.name}`);
      } catch (err: any) {
        console.error(`Error processing schedule ${schedule.id}:`, err);
        
        // Send failure email
        if (adminEmail) {
          await sendBackupEmail(resend, adminEmail, false, {
            siteName: siteDomain,
            scheduleName: schedule.name,
            error: err.message,
            failedAt: now.toISOString(),
          });
        }

        results.push({ schedule_id: schedule.id, success: false, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Scheduled backup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});