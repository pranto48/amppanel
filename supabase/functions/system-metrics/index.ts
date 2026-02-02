import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Simulates realistic server metrics with some variation
function generateRealisticMetrics(previousMetrics?: any) {
  const baseLoad = 35 + Math.sin(Date.now() / 60000) * 15; // Oscillates over time
  
  const prev = previousMetrics || {
    cpu_percent: 45,
    memory_used_mb: 6500,
    disk_used_gb: 180,
    network_in_mbps: 25,
    network_out_mbps: 15,
  };

  // Add some realistic variance
  const variance = (base: number, range: number) => 
    Math.max(0, Math.min(100, base + (Math.random() - 0.5) * range));

  const memoryTotal = 16384; // 16GB
  const diskTotal = 500; // 500GB
  
  return {
    cpu_percent: variance(baseLoad, 20),
    memory_used_mb: variance(prev.memory_used_mb, 500),
    memory_total_mb: memoryTotal,
    disk_used_gb: Math.min(diskTotal * 0.9, prev.disk_used_gb + (Math.random() - 0.3) * 0.1),
    disk_total_gb: diskTotal,
    network_in_mbps: variance(prev.network_in_mbps, 30),
    network_out_mbps: variance(prev.network_out_mbps, 20),
    load_avg_1m: variance(baseLoad / 25, 0.5),
    load_avg_5m: variance(baseLoad / 27, 0.3),
    load_avg_15m: variance(baseLoad / 30, 0.2),
    uptime_seconds: Math.floor(Date.now() / 1000) - 1704067200, // Since Jan 1, 2024
    recorded_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'get';
    const siteId = url.searchParams.get('site_id');
    const limit = parseInt(url.searchParams.get('limit') || '60');
    const interval = url.searchParams.get('interval') || '1m'; // 1m, 5m, 1h, 1d

    console.log(`System metrics action: ${action}, site: ${siteId}, limit: ${limit}`);

    switch (action) {
      case 'get': {
        // Get historical metrics
        let query = supabaseAdmin
          .from('system_metrics')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(limit);

        if (siteId) {
          query = query.eq('site_id', siteId);
        } else {
          query = query.is('site_id', null);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, metrics: data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'latest': {
        // Get latest metrics, or generate new ones if stale
        let query = supabaseAdmin
          .from('system_metrics')
          .select('*')
          .order('recorded_at', { ascending: false })
          .limit(1);

        if (siteId) {
          query = query.eq('site_id', siteId);
        } else {
          query = query.is('site_id', null);
        }

        const { data: existing } = await query;
        
        const now = Date.now();
        const lastRecorded = existing?.[0]?.recorded_at;
        const isStale = !lastRecorded || (now - new Date(lastRecorded).getTime()) > 30000; // 30 seconds

        if (isStale) {
          // Generate and store new metrics
          const newMetrics = generateRealisticMetrics(existing?.[0]);
          
          const { data: inserted, error: insertError } = await supabaseAdmin
            .from('system_metrics')
            .insert({
              site_id: siteId || null,
              ...newMetrics,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error inserting metrics:', insertError);
            // Return generated metrics even if insert fails
            return new Response(
              JSON.stringify({ success: true, metrics: newMetrics, fresh: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, metrics: inserted, fresh: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, metrics: existing[0], fresh: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'record': {
        // Record metrics from an external agent
        const body = await req.json();
        
        const { data, error } = await supabaseAdmin
          .from('system_metrics')
          .insert({
            site_id: body.site_id || null,
            cpu_percent: body.cpu_percent,
            memory_used_mb: body.memory_used_mb,
            memory_total_mb: body.memory_total_mb,
            disk_used_gb: body.disk_used_gb,
            disk_total_gb: body.disk_total_gb,
            network_in_mbps: body.network_in_mbps,
            network_out_mbps: body.network_out_mbps,
            load_avg_1m: body.load_avg_1m,
            load_avg_5m: body.load_avg_5m,
            load_avg_15m: body.load_avg_15m,
            uptime_seconds: body.uptime_seconds,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, metrics: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'summary': {
        // Get aggregated summary for dashboard
        const { data: latest } = await supabaseAdmin
          .from('system_metrics')
          .select('*')
          .is('site_id', null)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .single();

        // Get metrics from last hour for trending
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const { data: hourlyData } = await supabaseAdmin
          .from('system_metrics')
          .select('cpu_percent, memory_used_mb, network_in_mbps, network_out_mbps, recorded_at')
          .is('site_id', null)
          .gte('recorded_at', oneHourAgo)
          .order('recorded_at', { ascending: true });

        return new Response(
          JSON.stringify({ 
            success: true, 
            current: latest || generateRealisticMetrics(),
            history: hourlyData || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('System metrics error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
