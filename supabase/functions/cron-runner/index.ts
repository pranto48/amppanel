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

    const body = await req.json().catch(() => ({}));
    const { job_id, action } = body;

    // Handle different actions
    if (action === 'run_all_due') {
      // Run all due cron jobs (called by scheduler)
      const now = new Date();
      console.log(`Running all due cron jobs at ${now.toISOString()}`);

      const { data: dueJobs, error: fetchError } = await supabaseAdmin
        .from('cron_jobs')
        .select('*')
        .eq('is_enabled', true)
        .lte('next_run_at', now.toISOString());

      if (fetchError) {
        console.error('Error fetching due jobs:', fetchError);
        throw fetchError;
      }

      console.log(`Found ${dueJobs?.length || 0} jobs due for execution`);
      const results = [];

      for (const job of dueJobs || []) {
        const startTime = Date.now();
        let logId: string | null = null;

        try {
          // Create log entry
          const { data: logEntry } = await supabaseAdmin
            .from('cron_job_logs')
            .insert({
              job_id: job.id,
              status: 'running',
            })
            .select('id')
            .single();
          
          logId = logEntry?.id || null;

          // Simulate running the command
          console.log(`Executing job: ${job.name}`);
          console.log(`Command: ${job.command}`);
          
          // In a real implementation, this would execute the actual command
          // For now, we simulate success with some randomness
          const success = Math.random() > 0.1; // 90% success rate
          const output = success 
            ? `Job '${job.name}' completed successfully at ${now.toISOString()}`
            : `Job '${job.name}' failed: Simulated error for testing`;

          // Calculate next run time based on cron expression
          const nextRun = calculateNextRun(job.schedule);
          const executionTime = Date.now() - startTime;

          // Update job status
          await supabaseAdmin
            .from('cron_jobs')
            .update({
              last_run_at: now.toISOString(),
              last_status: success ? 'success' : 'failed',
              last_output: output,
              next_run_at: nextRun,
            })
            .eq('id', job.id);

          // Update log entry
          if (logId) {
            await supabaseAdmin
              .from('cron_job_logs')
              .update({
                completed_at: new Date().toISOString(),
                status: success ? 'success' : 'failed',
                output: output,
                error_message: success ? null : 'Simulated error for testing',
                execution_time_ms: executionTime,
              })
              .eq('id', logId);
          }

          results.push({
            job_id: job.id,
            name: job.name,
            success,
            output,
            next_run: nextRun,
          });

          console.log(`Job ${job.name}: ${success ? 'SUCCESS' : 'FAILED'}`);
        } catch (err: any) {
          console.error(`Error executing job ${job.id}:`, err);
          const executionTime = Date.now() - startTime;
          
          await supabaseAdmin
            .from('cron_jobs')
            .update({
              last_run_at: now.toISOString(),
              last_status: 'failed',
              last_output: err.message,
            })
            .eq('id', job.id);

          // Update log entry with error
          if (logId) {
            await supabaseAdmin
              .from('cron_job_logs')
              .update({
                completed_at: new Date().toISOString(),
                status: 'failed',
                error_message: err.message,
                execution_time_ms: executionTime,
              })
              .eq('id', logId);
          }

          results.push({
            job_id: job.id,
            name: job.name,
            success: false,
            error: err.message,
          });
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
    }

    // Run a specific job
    if (job_id) {
      console.log(`Running specific job: ${job_id}`);
      const startTime = Date.now();

      const { data: job, error: jobError } = await supabaseAdmin
        .from('cron_jobs')
        .select('*')
        .eq('id', job_id)
        .single();

      if (jobError || !job) {
        throw new Error('Job not found');
      }

      // Create log entry
      const { data: logEntry } = await supabaseAdmin
        .from('cron_job_logs')
        .insert({
          job_id: job_id,
          status: 'running',
        })
        .select('id')
        .single();

      const logId = logEntry?.id || null;
      const now = new Date();
      
      // Simulate running the command
      console.log(`Executing job: ${job.name}`);
      console.log(`Command: ${job.command}`);

      // Simulate execution time
      await new Promise(resolve => setTimeout(resolve, 1000));

      const success = Math.random() > 0.1;
      const output = success 
        ? `Job '${job.name}' completed successfully at ${now.toISOString()}\n\nOutput:\n${simulateCommandOutput(job)}`
        : `Job '${job.name}' failed: Command execution error`;

      // Calculate next run time
      const nextRun = calculateNextRun(job.schedule);
      const executionTime = Date.now() - startTime;

      // Update job status
      await supabaseAdmin
        .from('cron_jobs')
        .update({
          last_run_at: now.toISOString(),
          last_status: success ? 'success' : 'failed',
          last_output: output,
          next_run_at: nextRun,
        })
        .eq('id', job_id);

      // Update log entry
      if (logId) {
        await supabaseAdmin
          .from('cron_job_logs')
          .update({
            completed_at: new Date().toISOString(),
            status: success ? 'success' : 'failed',
            output: output,
            error_message: success ? null : 'Command execution error',
            execution_time_ms: executionTime,
          })
          .eq('id', logId);
      }

      return new Response(
        JSON.stringify({
          success,
          job_id,
          output,
          next_run: nextRun,
          execution_time_ms: executionTime,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'No job_id or action specified' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Cron runner error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateNextRun(schedule: string): string {
  const now = new Date();
  const parts = schedule.split(' ');
  
  if (parts.length !== 5) {
    // Default to next hour if invalid
    const next = new Date(now);
    next.setHours(next.getHours() + 1);
    next.setMinutes(0);
    next.setSeconds(0);
    return next.toISOString();
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  const next = new Date(now);
  
  // Simple calculation for common patterns
  if (minute === '*' && hour === '*') {
    // Every minute
    next.setMinutes(next.getMinutes() + 1);
  } else if (minute.startsWith('*/')) {
    // Every X minutes
    const interval = parseInt(minute.slice(2), 10);
    next.setMinutes(Math.ceil(next.getMinutes() / interval) * interval + interval);
  } else if (hour.startsWith('*/')) {
    // Every X hours
    const interval = parseInt(hour.slice(2), 10);
    next.setHours(Math.ceil(next.getHours() / interval) * interval + interval);
    next.setMinutes(parseInt(minute, 10) || 0);
  } else if (hour !== '*' && minute !== '*') {
    // Specific time daily
    next.setHours(parseInt(hour, 10));
    next.setMinutes(parseInt(minute, 10));
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  } else {
    // Default: next day at specified time
    next.setDate(next.getDate() + 1);
    if (hour !== '*') next.setHours(parseInt(hour, 10));
    if (minute !== '*') next.setMinutes(parseInt(minute, 10));
  }

  next.setSeconds(0);
  next.setMilliseconds(0);
  
  return next.toISOString();
}

function simulateCommandOutput(job: any): string {
  switch (job.job_type) {
    case 'backup':
      return `Starting backup process...
Connecting to database...
Creating snapshot...
Compressing data: 245 MB
Uploading to backup storage...
Backup completed: backup_${new Date().toISOString().split('T')[0]}.tar.gz
Total time: 3m 42s`;
    case 'cleanup':
      return `Starting cleanup process...
Scanning for temporary files...
Found 1,247 files (892 MB)
Removing old log files: 156 files
Removing cache files: 891 files
Removing orphaned uploads: 200 files
Cleanup complete. Freed: 892 MB`;
    case 'maintenance':
      return `Starting maintenance tasks...
Checking disk space: OK (45% used)
Optimizing database tables: 12 tables optimized
Updating system packages: 3 updates available
Rotating log files: 8 files rotated
Maintenance complete.`;
    default:
      return `Command executed successfully.
Exit code: 0`;
  }
}
