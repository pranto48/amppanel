import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationEmailRequest {
  to: string;
  subject: string;
  type: "backup_completed" | "backup_failed" | "security_alert" | "cron_job_failed" | "site_down" | "ssl_expiring" | "general";
  data?: Record<string, any>;
}

const getEmailTemplate = (type: string, data: Record<string, any> = {}) => {
  const styles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
      .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
      .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px; }
      .alert-success { border-left: 4px solid #22c55e; background: #f0fdf4; padding: 15px; margin: 15px 0; }
      .alert-error { border-left: 4px solid #ef4444; background: #fef2f2; padding: 15px; margin: 15px 0; }
      .alert-warning { border-left: 4px solid #f59e0b; background: #fffbeb; padding: 15px; margin: 15px 0; }
      .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
      .details { background: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; }
      .details table { width: 100%; border-collapse: collapse; }
      .details td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
      .details td:first-child { font-weight: 600; color: #64748b; width: 40%; }
    </style>
  `;

  const templates: Record<string, { subject: string; body: string }> = {
    backup_completed: {
      subject: `✅ Backup Completed: ${data.siteName || "Your Site"}`,
      body: `
        ${styles}
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">Backup Completed Successfully</h1>
          </div>
          <div class="content">
            <div class="alert-success">
              <strong>Great news!</strong> Your backup has been completed successfully.
            </div>
            <div class="details">
              <table>
                <tr><td>Site</td><td>${data.siteName || "N/A"}</td></tr>
                <tr><td>Backup Name</td><td>${data.backupName || "N/A"}</td></tr>
                <tr><td>Size</td><td>${data.size || "N/A"}</td></tr>
                <tr><td>Type</td><td>${data.type || "Full"}</td></tr>
                <tr><td>Completed At</td><td>${data.completedAt || new Date().toISOString()}</td></tr>
              </table>
            </div>
            <p>Your data is safe and secure. You can restore from this backup at any time from your panel.</p>
          </div>
          <div class="footer">
            <p>AMP Panel - Server Management Made Simple</p>
          </div>
        </div>
      `,
    },
    backup_failed: {
      subject: `❌ Backup Failed: ${data.siteName || "Your Site"}`,
      body: `
        ${styles}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
            <h1 style="margin:0;">Backup Failed</h1>
          </div>
          <div class="content">
            <div class="alert-error">
              <strong>Attention Required!</strong> A backup has failed and needs your attention.
            </div>
            <div class="details">
              <table>
                <tr><td>Site</td><td>${data.siteName || "N/A"}</td></tr>
                <tr><td>Backup Name</td><td>${data.backupName || "N/A"}</td></tr>
                <tr><td>Error</td><td>${data.error || "Unknown error"}</td></tr>
                <tr><td>Failed At</td><td>${data.failedAt || new Date().toISOString()}</td></tr>
              </table>
            </div>
            <p>Please check your server configuration and try again. If the issue persists, check the logs for more details.</p>
          </div>
          <div class="footer">
            <p>AMP Panel - Server Management Made Simple</p>
          </div>
        </div>
      `,
    },
    security_alert: {
      subject: `🚨 Security Alert: ${data.alertType || "Important Notice"}`,
      body: `
        ${styles}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
            <h1 style="margin:0;">Security Alert</h1>
          </div>
          <div class="content">
            <div class="alert-warning">
              <strong>Security Notice!</strong> A security event has been detected.
            </div>
            <div class="details">
              <table>
                <tr><td>Alert Type</td><td>${data.alertType || "N/A"}</td></tr>
                <tr><td>Description</td><td>${data.description || "N/A"}</td></tr>
                <tr><td>IP Address</td><td>${data.ipAddress || "N/A"}</td></tr>
                <tr><td>Detected At</td><td>${data.detectedAt || new Date().toISOString()}</td></tr>
              </table>
            </div>
            <p>Please review this activity and take appropriate action if necessary.</p>
          </div>
          <div class="footer">
            <p>AMP Panel - Server Management Made Simple</p>
          </div>
        </div>
      `,
    },
    cron_job_failed: {
      subject: `⚠️ Cron Job Failed: ${data.jobName || "Scheduled Task"}`,
      body: `
        ${styles}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
            <h1 style="margin:0;">Scheduled Task Failed</h1>
          </div>
          <div class="content">
            <div class="alert-error">
              <strong>Task Failure!</strong> A scheduled cron job has failed.
            </div>
            <div class="details">
              <table>
                <tr><td>Job Name</td><td>${data.jobName || "N/A"}</td></tr>
                <tr><td>Schedule</td><td>${data.schedule || "N/A"}</td></tr>
                <tr><td>Error</td><td>${data.error || "Unknown error"}</td></tr>
                <tr><td>Failed At</td><td>${data.failedAt || new Date().toISOString()}</td></tr>
              </table>
            </div>
            <p>Please check the job configuration and logs for more details.</p>
          </div>
          <div class="footer">
            <p>AMP Panel - Server Management Made Simple</p>
          </div>
        </div>
      `,
    },
    site_down: {
      subject: `🔴 Site Down: ${data.domain || "Your Site"}`,
      body: `
        ${styles}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
            <h1 style="margin:0;">Site Unreachable</h1>
          </div>
          <div class="content">
            <div class="alert-error">
              <strong>Critical!</strong> Your site appears to be down or unreachable.
            </div>
            <div class="details">
              <table>
                <tr><td>Domain</td><td>${data.domain || "N/A"}</td></tr>
                <tr><td>Status Code</td><td>${data.statusCode || "N/A"}</td></tr>
                <tr><td>Response Time</td><td>${data.responseTime || "Timeout"}</td></tr>
                <tr><td>Detected At</td><td>${data.detectedAt || new Date().toISOString()}</td></tr>
              </table>
            </div>
            <p>Please check your server immediately and take appropriate action.</p>
          </div>
          <div class="footer">
            <p>AMP Panel - Server Management Made Simple</p>
          </div>
        </div>
      `,
    },
    ssl_expiring: {
      subject: `🔐 SSL Certificate Expiring: ${data.domain || "Your Site"}`,
      body: `
        ${styles}
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
            <h1 style="margin:0;">SSL Certificate Expiring Soon</h1>
          </div>
          <div class="content">
            <div class="alert-warning">
              <strong>Action Required!</strong> Your SSL certificate is expiring soon.
            </div>
            <div class="details">
              <table>
                <tr><td>Domain</td><td>${data.domain || "N/A"}</td></tr>
                <tr><td>Expires On</td><td>${data.expiresAt || "N/A"}</td></tr>
                <tr><td>Days Remaining</td><td>${data.daysRemaining || "N/A"}</td></tr>
              </table>
            </div>
            <p>Please renew your SSL certificate before it expires to avoid security warnings for your visitors.</p>
          </div>
          <div class="footer">
            <p>AMP Panel - Server Management Made Simple</p>
          </div>
        </div>
      `,
    },
    general: {
      subject: data.subject || "Notification from AMP Panel",
      body: `
        ${styles}
        <div class="container">
          <div class="header">
            <h1 style="margin:0;">${data.title || "Notification"}</h1>
          </div>
          <div class="content">
            <p>${data.message || "You have a new notification."}</p>
            ${data.details ? `
              <div class="details">
                <table>
                  ${Object.entries(data.details).map(([key, value]) => 
                    `<tr><td>${key}</td><td>${value}</td></tr>`
                  ).join("")}
                </table>
              </div>
            ` : ""}
          </div>
          <div class="footer">
            <p>AMP Panel - Server Management Made Simple</p>
          </div>
        </div>
      `,
    },
  };

  return templates[type] || templates.general;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);

    // Get authorization header for user validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { to, subject, type, data }: NotificationEmailRequest = await req.json();

    // Validate required fields
    if (!to || !type) {
      throw new Error("Missing required fields: to, type");
    }

    const template = getEmailTemplate(type, data);

    console.log(`Sending ${type} email to ${to}`);

    const emailResponse = await resend.emails.send({
      from: "AMP Panel <notifications@resend.dev>", // Use your verified domain
      to: [to],
      subject: subject || template.subject,
      html: template.body,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
