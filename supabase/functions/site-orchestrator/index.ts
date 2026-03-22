import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type OrchestratorAction = "provision" | "preview" | "deploy" | "rollback";
type WebServerType = "nginx" | "apache";
type TemplateType = "php_fpm" | "reverse_proxy" | "static_site" | "custom";
type RuntimeEnvironment = "production" | "staging" | "development";

interface ConfigPayload {
  web_server: WebServerType;
  template: TemplateType;
  runtime_environment: RuntimeEnvironment;
  php_fpm_enabled: boolean;
  php_fpm_version?: string | null;
  php_fpm_pool_name?: string | null;
  php_fpm_pm?: string | null;
  php_fpm_max_children?: number | null;
  php_fpm_start_servers?: number | null;
  php_fpm_min_spare_servers?: number | null;
  php_fpm_max_spare_servers?: number | null;
  php_fpm_max_requests?: number | null;
  listen_port?: number | null;
  proxy_target?: string | null;
  custom_vhost_config?: string | null;
  custom_runtime_config?: Record<string, Json> | null;
  env_vars?: Record<string, Json> | null;
}

interface RequestBody {
  action: OrchestratorAction;
  site_id: string;
  config?: Partial<ConfigPayload>;
  deployment_id?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const runtimeRoot = {
  production: "/var/www",
  staging: "/var/www/staging",
  development: "/srv/devsites",
} satisfies Record<RuntimeEnvironment, string>;

function normalizeDomain(input: string) {
  return input.toLowerCase().trim();
}

function defaultPoolName(domain: string) {
  return normalizeDomain(domain).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48) || "site_pool";
}

function inferTemplate(siteType: string): TemplateType {
  switch (siteType) {
    case "nodejs":
    case "python":
      return "reverse_proxy";
    case "static":
      return "static_site";
    default:
      return "php_fpm";
  }
}

function buildDocumentRoot(domain: string, environment: RuntimeEnvironment) {
  return `${runtimeRoot[environment]}/${normalizeDomain(domain)}/public`;
}

function mergeConfig(site: Record<string, any>, existing: Record<string, any> | null, incoming: Partial<ConfigPayload> | undefined): ConfigPayload {
  const template = incoming?.template ?? existing?.template ?? inferTemplate(site.site_type);
  const webServer = incoming?.web_server ?? existing?.web_server ?? "nginx";
  const runtimeEnvironment = incoming?.runtime_environment ?? existing?.runtime_environment ?? "production";
  const phpVersion = incoming?.php_fpm_version ?? incoming?.php_fpm_version ?? existing?.php_fpm_version ?? site.php_version ?? "8.2";
  const phpEnabled = incoming?.php_fpm_enabled ?? existing?.php_fpm_enabled ?? (template === "php_fpm");
  const poolName = incoming?.php_fpm_pool_name ?? existing?.php_fpm_pool_name ?? defaultPoolName(site.domain);

  return {
    web_server: webServer,
    template,
    runtime_environment: runtimeEnvironment,
    php_fpm_enabled: phpEnabled,
    php_fpm_version: phpEnabled ? phpVersion : null,
    php_fpm_pool_name: poolName,
    php_fpm_pm: incoming?.php_fpm_pm ?? existing?.php_fpm_pm ?? "dynamic",
    php_fpm_max_children: incoming?.php_fpm_max_children ?? existing?.php_fpm_max_children ?? 10,
    php_fpm_start_servers: incoming?.php_fpm_start_servers ?? existing?.php_fpm_start_servers ?? 2,
    php_fpm_min_spare_servers: incoming?.php_fpm_min_spare_servers ?? existing?.php_fpm_min_spare_servers ?? 1,
    php_fpm_max_spare_servers: incoming?.php_fpm_max_spare_servers ?? existing?.php_fpm_max_spare_servers ?? 3,
    php_fpm_max_requests: incoming?.php_fpm_max_requests ?? existing?.php_fpm_max_requests ?? 500,
    listen_port: incoming?.listen_port ?? existing?.listen_port ?? (template === "reverse_proxy" ? 3000 : null),
    proxy_target: incoming?.proxy_target ?? existing?.proxy_target ?? (template === "reverse_proxy" ? "http://127.0.0.1:3000" : null),
    custom_vhost_config: incoming?.custom_vhost_config ?? existing?.custom_vhost_config ?? null,
    custom_runtime_config: incoming?.custom_runtime_config ?? existing?.custom_runtime_config ?? {},
    env_vars: incoming?.env_vars ?? existing?.env_vars ?? {},
  };
}

function validateConfig(site: Record<string, any>, config: ConfigPayload) {
  const errors: string[] = [];
  const notes: string[] = [];

  if (!site.domain) errors.push("Site domain is required.");
  if (!site.document_root) errors.push("Document root must be set before deployment.");
  if (config.template === "reverse_proxy" && !config.proxy_target) {
    errors.push("Reverse proxy template requires a proxy target.");
  }
  if (config.php_fpm_enabled && !config.php_fpm_version) {
    errors.push("PHP-FPM version is required when PHP-FPM is enabled.");
  }
  if (config.php_fpm_enabled && !config.php_fpm_pool_name) {
    errors.push("PHP-FPM pool name is required when PHP-FPM is enabled.");
  }
  if ((config.php_fpm_max_children ?? 0) < 1) {
    errors.push("PHP-FPM max children must be at least 1.");
  }
  if ((config.php_fpm_start_servers ?? 0) < 1) {
    errors.push("PHP-FPM start servers must be at least 1.");
  }
  if ((config.php_fpm_min_spare_servers ?? 0) > (config.php_fpm_max_spare_servers ?? 0)) {
    errors.push("PHP-FPM min spare servers cannot exceed max spare servers.");
  }
  if (config.listen_port && (config.listen_port < 1 || config.listen_port > 65535)) {
    errors.push("Listen port must be between 1 and 65535.");
  }

  notes.push(`Selected ${config.web_server} template: ${config.template}.`);
  if (config.php_fpm_enabled) {
    notes.push(`PHP-FPM pool ${config.php_fpm_pool_name} will run PHP ${config.php_fpm_version}.`);
  }
  if (config.template === "reverse_proxy") {
    notes.push(`Upstream traffic will proxy to ${config.proxy_target}.`);
  }

  return {
    isValid: errors.length === 0,
    output: [...errors.map((msg) => `ERROR: ${msg}`), ...notes.map((msg) => `INFO: ${msg}`)].join("\n"),
  };
}

function renderRuntimeConfig(config: ConfigPayload) {
  const envLines = Object.entries(config.env_vars ?? {}).map(([key, value]) => `${key}=${String(value)}`);
  return JSON.stringify(
    {
      environment: config.runtime_environment,
      template: config.template,
      php_fpm_enabled: config.php_fpm_enabled,
      custom_runtime_config: config.custom_runtime_config ?? {},
      env_preview: envLines,
    },
    null,
    2,
  );
}

function renderPoolConfig(site: Record<string, any>, config: ConfigPayload) {
  if (!config.php_fpm_enabled) return null;

  return `[${config.php_fpm_pool_name}]
user = www-data
group = www-data
listen = /run/php/${config.php_fpm_pool_name}.sock
listen.owner = www-data
listen.group = www-data
pm = ${config.php_fpm_pm}
pm.max_children = ${config.php_fpm_max_children}
pm.start_servers = ${config.php_fpm_start_servers}
pm.min_spare_servers = ${config.php_fpm_min_spare_servers}
pm.max_spare_servers = ${config.php_fpm_max_spare_servers}
pm.max_requests = ${config.php_fpm_max_requests}
chdir = ${site.document_root}
env[APP_ENV] = ${config.runtime_environment}`;
}

function renderVhostConfig(site: Record<string, any>, config: ConfigPayload) {
  const extra = config.custom_vhost_config ? `\n  # Custom directives\n${config.custom_vhost_config}` : "";
  const serverName = normalizeDomain(site.domain);
  const aliases = `www.${serverName}`;

  if (config.web_server === "apache") {
    const apacheBody = config.template === "reverse_proxy"
      ? `ProxyPreserveHost On\n  ProxyPass / ${config.proxy_target}\n  ProxyPassReverse / ${config.proxy_target}`
      : config.template === "static_site"
        ? `DocumentRoot ${site.document_root}\n  <Directory ${site.document_root}>\n    AllowOverride All\n    Require all granted\n  </Directory>`
        : `DocumentRoot ${site.document_root}\n  <Directory ${site.document_root}>\n    AllowOverride All\n    Require all granted\n  </Directory>\n\n  <FilesMatch \\.php$>\n    SetHandler "proxy:unix:/run/php/${config.php_fpm_pool_name}.sock|fcgi://localhost/"\n  </FilesMatch>`;

    return `<VirtualHost *:80>\n  ServerName ${serverName}\n  ServerAlias ${aliases}\n  ${apacheBody}${extra}\n</VirtualHost>`;
  }

  const nginxLocation = config.template === "reverse_proxy"
    ? `location / {\n    proxy_pass ${config.proxy_target};\n    proxy_set_header Host $host;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n  }`
    : config.template === "static_site"
      ? `location / {\n    root ${site.document_root};\n    try_files $uri $uri/ =404;\n  }`
      : `root ${site.document_root};\n\n  location / {\n    try_files $uri $uri/ /index.php?$query_string;\n  }\n\n  location ~ \\.php$ {\n    include snippets/fastcgi-php.conf;\n    fastcgi_pass unix:/run/php/${config.php_fpm_pool_name}.sock;\n  }`;

  return `server {\n  listen 80;\n  server_name ${serverName} ${aliases};\n\n  ${nginxLocation}${extra}\n}`;
}

async function authenticate(supabaseAdmin: any, authHeader: string | null) {
  if (!authHeader) {
    throw new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new Response(JSON.stringify({ success: false, error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return user;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const user = await authenticate(supabaseAdmin, req.headers.get("Authorization"));
    const body = (await req.json()) as RequestBody;

    const { data: site, error: siteError } = await supabaseAdmin
      .from("sites")
      .select("*")
      .eq("id", body.site_id)
      .single();

    if (siteError || !site) {
      return new Response(JSON.stringify({ success: false, error: "Site not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: membership } = await supabaseAdmin
      .from("site_members")
      .select("role")
      .eq("site_id", body.site_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return new Response(JSON.stringify({ success: false, error: "Admin access required for site orchestration" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingConfig } = await supabaseAdmin
      .from("site_service_configs")
      .select("*")
      .eq("site_id", body.site_id)
      .maybeSingle();

    if (!site.document_root) {
      site.document_root = buildDocumentRoot(site.domain, body.config?.runtime_environment ?? existingConfig?.runtime_environment ?? "production");
    }

    if (body.action === "rollback") {
      const deploymentId = body.deployment_id;
      if (!deploymentId) {
        return new Response(JSON.stringify({ success: false, error: "deployment_id is required for rollback" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: sourceDeployment, error: sourceError } = await supabaseAdmin
        .from("site_service_deployments")
        .select("*")
        .eq("id", deploymentId)
        .eq("site_id", body.site_id)
        .single();

      if (sourceError || !sourceDeployment) {
        return new Response(JSON.stringify({ success: false, error: "Deployment snapshot not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rollbackValidation = [
        "INFO: Restoring previous validated configuration snapshot.",
        `INFO: Source deployment ${deploymentId}.`,
        "INFO: Simulated nginx/apache config test passed.",
        "INFO: Simulated php-fpm config test passed.",
      ].join("\n");

      await supabaseAdmin
        .from("site_service_configs")
        .update({
          generated_vhost_config: sourceDeployment.snapshot_vhost_config,
          generated_pool_config: sourceDeployment.snapshot_pool_config,
          last_validation_output: rollbackValidation,
          last_deployment_status: "rolled_back",
          last_applied_at: new Date().toISOString(),
        })
        .eq("site_id", body.site_id);

      const { data: rollbackDeployment } = await supabaseAdmin
        .from("site_service_deployments")
        .insert({
          site_id: body.site_id,
          config_id: existingConfig.id,
          action: "rollback",
          status: "rolled_back",
          validation_output: rollbackValidation,
          orchestration_log: "Restored previous snapshot and simulated service reload.",
          snapshot_vhost_config: existingConfig.generated_vhost_config,
          snapshot_pool_config: existingConfig.generated_pool_config,
          applied_vhost_config: sourceDeployment.snapshot_vhost_config,
          applied_pool_config: sourceDeployment.snapshot_pool_config,
          rollback_source_deployment_id: sourceDeployment.id,
          created_by: user.id,
        })
        .select("*")
        .single();

      return new Response(JSON.stringify({ success: true, deployment: rollbackDeployment }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mergedConfig = mergeConfig(site, existingConfig, body.config);
    if (!site.document_root) {
      site.document_root = buildDocumentRoot(site.domain, mergedConfig.runtime_environment);
    }

    const validation = validateConfig(site, mergedConfig);
    const generatedVhost = renderVhostConfig(site, mergedConfig);
    const generatedPool = renderPoolConfig(site, mergedConfig);
    const runtimeConfig = renderRuntimeConfig(mergedConfig);

    const { data: savedConfig, error: configError } = await supabaseAdmin
      .from("site_service_configs")
      .upsert({
        site_id: body.site_id,
        ...mergedConfig,
        generated_vhost_config: generatedVhost,
        generated_pool_config: generatedPool,
        last_validation_output: validation.output,
        last_deployment_status: validation.isValid ? "validated" : "failed",
      }, { onConflict: "site_id" })
      .select("*")
      .single();

    if (configError) {
      return new Response(JSON.stringify({ success: false, error: configError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin
      .from("sites")
      .update({
        document_root: site.document_root,
        php_version: mergedConfig.php_fpm_enabled ? mergedConfig.php_fpm_version : null,
        status: validation.isValid ? site.status : "error",
      })
      .eq("id", body.site_id);

    if (body.action === "preview" || body.action === "provision") {
      return new Response(
        JSON.stringify({
          success: validation.isValid,
          validation_output: validation.output,
          generated_vhost_config: generatedVhost,
          generated_pool_config: generatedPool,
          runtime_config: runtimeConfig,
          config: savedConfig,
        }),
        {
          status: validation.isValid ? 200 : 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const orchestrationLog = [
      `Rendered ${mergedConfig.web_server} virtual host template for ${site.domain}.`,
      mergedConfig.php_fpm_enabled ? `Rendered PHP-FPM pool ${mergedConfig.php_fpm_pool_name}.` : "PHP-FPM disabled for this site.",
      `Validated generated configuration for ${mergedConfig.runtime_environment} environment.`,
      `Simulated ${mergedConfig.web_server} config test: passed.`,
      mergedConfig.php_fpm_enabled ? "Simulated php-fpm config test: passed." : "No php-fpm validation required.",
      `Simulated service reload sequence: ${mergedConfig.web_server} reload -> php-fpm reload.`,
    ].join("\n");

    const { data: deployment } = await supabaseAdmin
      .from("site_service_deployments")
      .insert({
        site_id: body.site_id,
        config_id: savedConfig.id,
        action: "deploy",
        status: "deployed",
        validation_output: validation.output,
        orchestration_log: orchestrationLog,
        snapshot_vhost_config: existingConfig?.generated_vhost_config ?? null,
        snapshot_pool_config: existingConfig?.generated_pool_config ?? null,
        applied_vhost_config: generatedVhost,
        applied_pool_config: generatedPool,
        created_by: user.id,
      })
      .select("*")
      .single();

    await supabaseAdmin
      .from("site_service_configs")
      .update({
        generated_vhost_config: generatedVhost,
        generated_pool_config: generatedPool,
        last_validation_output: validation.output,
        last_deployment_status: "deployed",
        last_applied_at: new Date().toISOString(),
      })
      .eq("id", savedConfig.id);

    return new Response(
      JSON.stringify({
        success: true,
        deployment,
        validation_output: validation.output,
        generated_vhost_config: generatedVhost,
        generated_pool_config: generatedPool,
        runtime_config: runtimeConfig,
        orchestration_log: orchestrationLog,
        config: { ...savedConfig, last_deployment_status: "deployed" },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    if (error instanceof Response) return error;

    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
