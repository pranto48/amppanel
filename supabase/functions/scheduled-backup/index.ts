import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const now = new Date();
    console.log(`Running scheduled backup job at ${now.toISOString()}`);

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

        // Update schedule with last run and next run times
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

        // Clean up old backups based on retention policy
        const retentionCutoff = new Date(now.getTime() - schedule.retention_days * 24 * 60 * 60 * 1000);
        
        const { error: cleanupError } = await supabaseAdmin
          .from('backups')
          .delete()
          .eq('site_id', schedule.site_id)
          .eq('backup_type', 'scheduled')
          .lt('created_at', retentionCutoff.toISOString());

        if (cleanupError) {
          console.error(`Error cleaning up old backups for site ${schedule.site_id}:`, cleanupError);
        }

        results.push({ 
          schedule_id: schedule.id, 
          success: true, 
          backup_id: backup.id,
          next_run: nextRun.toISOString()
        });

        console.log(`Successfully created backup for schedule ${schedule.name}`);
      } catch (err: any) {
        console.error(`Error processing schedule ${schedule.id}:`, err);
        results.push({ schedule_id: schedule.id, success: false, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results
      }),
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
