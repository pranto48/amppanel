import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type OrchestratorAction = "provision" | "preview" | "test" | "deploy" | "rollback";
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
  php_ini_overrides?: Record<string, Json> | null;
  access_log_path?: string | null;
  error_log_path?: string | null;
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

const supportedPhpVersions = new Set(["8.3", "8.2", "8.1", "8.0", "7.4"]);

function normalizeDomain(input: string) {
  return input.toLowerCase().trim();
}

function defaultPoolName(domain: string) {
  return normalizeDomain(domain).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48) || "site_pool";
}

function buildLogPath(domain: string, suffix: "access" | "error") {
  const slug = normalizeDomain(domain).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "site";
  return `/var/log/amp/${slug}-${suffix}.log`;
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
  const phpEnabled = incoming?.php_fpm_enabled ?? existing?.php_fpm_enabled ?? (template === "php_fpm");
  const phpVersion = incoming?.php_fpm_version ?? existing?.php_fpm_version ?? site.php_version ?? "8.2";

  return {
    web_server: webServer,
    template,
    runtime_environment: runtimeEnvironment,
    php_fpm_enabled: phpEnabled,
    php_fpm_version: phpEnabled ? phpVersion : null,
    php_fpm_pool_name: incoming?.php_fpm_pool_name ?? existing?.php_fpm_pool_name ?? defaultPoolName(site.domain),
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
    php_ini_overrides: incoming?.php_ini_overrides ?? existing?.php_ini_overrides ?? {},
    access_log_path: incoming?.access_log_path ?? existing?.access_log_path ?? buildLogPath(site.domain, "access"),
    error_log_path: incoming?.error_log_path ?? existing?.error_log_path ?? buildLogPath(site.domain, "error"),
  };
}

function validateConfig(site: Record<string, any>, config: ConfigPayload) {
  const errors: string[] = [];
  const notes: string[] = [];

  if (!site.domain) errors.push("Site domain is required.");
  if (!site.document_root) errors.push("Document root must be set before deployment.");
  if (config.template === "reverse_proxy" && !config.proxy_target) errors.push("Reverse proxy template requires a proxy target.");
  if (config.php_fpm_enabled && !config.php_fpm_version) errors.push("PHP-FPM version is required when PHP-FPM is enabled.");
  if (config.php_fpm_enabled && config.php_fpm_version && !supportedPhpVersions.has(config.php_fpm_version)) {
    errors.push(`Unsupported PHP version ${config.php_fpm_version}.`);
  }
  if (config.php_fpm_enabled && !config.php_fpm_pool_name) errors.push("PHP-FPM pool name is required when PHP-FPM is enabled.");
  if ((config.php_fpm_max_children ?? 0) < 1) errors.push("PHP-FPM max children must be at least 1.");
  if ((config.php_fpm_start_servers ?? 0) < 1) errors.push("PHP-FPM start servers must be at least 1.");
  if ((config.php_fpm_min_spare_servers ?? 0) > (config.php_fpm_max_spare_servers ?? 0)) errors.push("PHP-FPM min spare servers cannot exceed max spare servers.");
  if (config.listen_port && (config.listen_port < 1 || config.listen_port > 65535)) errors.push("Listen port must be between 1 and 65535.");
  if (!config.access_log_path || !config.error_log_path) errors.push("Access and error log paths are required.");
  if ((config.custom_vhost_config ?? "").includes("INVALID_DIRECTIVE")) errors.push("Custom vhost config contains INVALID_DIRECTIVE marker.");

  notes.push(`Selected ${config.web_server} template: ${config.template}.`);
  if (config.php_fpm_enabled) notes.push(`PHP-FPM pool ${config.php_fpm_pool_name} will run PHP ${config.php_fpm_version}.`);
  if (config.template === "reverse_proxy") notes.push(`Upstream traffic will proxy to ${config.proxy_target}.`);
  if (Object.keys(config.php_ini_overrides ?? {}).length > 0) notes.push(`Applied ${Object.keys(config.php_ini_overrides ?? {}).length} php.ini override(s).`);
  notes.push(`Access log: ${config.access_log_path}`);
  notes.push(`Error log: ${config.error_log_path}`);

  return {
    isValid: errors.length === 0,
    output: [...errors.map((msg) => `ERROR: ${msg}`), ...notes.map((msg) => `INFO: ${msg}`)].join("\n"),
  };
}

function renderRuntimeConfig(config: ConfigPayload) {
  const envLines = Object.entries(config.env_vars ?? {}).map(([key, value]) => `${key}=${String(value)}`);
  return JSON.stringify({
    environment: config.runtime_environment,
    template: config.template,
    php_fpm_enabled: config.php_fpm_enabled,
    php_ini_overrides: config.php_ini_overrides ?? {},
    custom_runtime_config: config.custom_runtime_config ?? {},
    env_preview: envLines,
  }, null, 2);
}

function renderPhpIniOverrides(config: ConfigPayload) {
  return Object.entries(config.php_ini_overrides ?? {})
    .map(([key, value]) => `php_admin_value[${key}] = ${String(value)}`)
    .join("\n");
}

function renderPoolConfig(site: Record<string, any>, config: ConfigPayload) {
  if (!config.php_fpm_enabled) return null;
  const phpIniOverrides = renderPhpIniOverrides(config);
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
env[APP_ENV] = ${config.runtime_environment}${phpIniOverrides ? `\n${phpIniOverrides}` : ""}`;
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

    return `<VirtualHost *:80>\n  ServerName ${serverName}\n  ServerAlias ${aliases}\n  ErrorLog ${config.error_log_path}\n  CustomLog ${config.access_log_path} combined\n  ${apacheBody}${extra}\n</VirtualHost>`;
  }

  const nginxLocation = config.template === "reverse_proxy"
    ? `location / {\n    proxy_pass ${config.proxy_target};\n    proxy_set_header Host $host;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n  }`
    : config.template === "static_site"
      ? `location / {\n    root ${site.document_root};\n    try_files $uri $uri/ =404;\n  }`
      : `root ${site.document_root};\n\n  location / {\n    try_files $uri $uri/ /index.php?$query_string;\n  }\n\n  location ~ \\.php$ {\n    include snippets/fastcgi-php.conf;\n    fastcgi_pass unix:/run/php/${config.php_fpm_pool_name}.sock;\n  }`;

  return `server {\n  listen 80;\n  server_name ${serverName} ${aliases};\n  access_log ${config.access_log_path};\n  error_log ${config.error_log_path};\n\n  ${nginxLocation}${extra}\n}`;
}

function testGeneratedConfig(config: ConfigPayload, generatedVhost: string, generatedPool: string | null) {
  const output: string[] = [];
  let passed = true;

  const openBraces = (generatedVhost.match(/\{/g) ?? []).length;
  const closeBraces = (generatedVhost.match(/\}/g) ?? []).length;
  if (openBraces !== closeBraces) {
    passed = false;
    output.push("ERROR: Web server config has unbalanced braces.");
  }
  if ((config.custom_vhost_config ?? "").includes("FAIL_TEST")) {
    passed = false;
    output.push("ERROR: Custom vhost config contains FAIL_TEST marker.");
  }
  if (generatedPool && generatedPool.includes("php_admin_value[disable_functions] =")) {
    output.push("INFO: php.ini override detected for disable_functions.");
  }
  output.push(`INFO: ${config.web_server} -t simulated successfully.`);
  output.push(generatedPool ? "INFO: php-fpm -t simulated successfully." : "INFO: No php-fpm config test required.");
  output.push(`INFO: Access log target ${config.access_log_path}.`);
  output.push(`INFO: Error log target ${config.error_log_path}.`);

  return { passed, output: output.join("\n") };
}

function buildSampleLogs(site: Record<string, any>, configId: string) {
  const now = new Date().toISOString();
  return [
    {
      site_id: site.id,
      config_id: configId,
      log_type: "access",
      message: `${now} ${site.domain} \"GET / HTTP/1.1\" 200 512 \"-\" \"AMP-Healthcheck/1.0\"`,
    },
    {
      site_id: site.id,
      config_id: configId,
      log_type: "error",
      message: `${now} [notice] deployment refreshed ${site.domain} with document root ${site.document_root}`,
    },
  ];
}

async function authenticate(supabaseAdmin: any, authHeader: string | null) {
  if (!authHeader) {
    throw new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    throw new Response(JSON.stringify({ success: false, error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  return user;
}

async function restoreSnapshot(supabaseAdmin: any, siteId: string, configId: string, sourceDeployment: any, existingConfig: any, userId: string, note: string, status: "rolled_back" | "failed") {
  const validationOutput = [
    note,
    `INFO: Restored snapshot from deployment ${sourceDeployment.id}.`,
    "INFO: Simulated service rollback completed.",
  ].join("\n");

  await supabaseAdmin
    .from("site_service_configs")
    .update({
      generated_vhost_config: sourceDeployment.applied_vhost_config ?? sourceDeployment.snapshot_vhost_config,
      generated_pool_config: sourceDeployment.applied_pool_config ?? sourceDeployment.snapshot_pool_config,
      last_validation_output: validationOutput,
      last_deployment_status: status,
      last_applied_at: new Date().toISOString(),
    })
    .eq("id", configId);

  return await supabaseAdmin
    .from("site_service_deployments")
    .insert({
      site_id: siteId,
      config_id: configId,
      action: "rollback",
      status,
      validation_output: validationOutput,
      orchestration_log: note,
      snapshot_vhost_config: existingConfig?.generated_vhost_config ?? null,
      snapshot_pool_config: existingConfig?.generated_pool_config ?? null,
      applied_vhost_config: sourceDeployment.applied_vhost_config ?? sourceDeployment.snapshot_vhost_config,
      applied_pool_config: sourceDeployment.applied_pool_config ?? sourceDeployment.snapshot_pool_config,
      rollback_source_deployment_id: sourceDeployment.id,
      created_by: userId,
    })
    .select("*")
    .single();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const user = await authenticate(supabaseAdmin, req.headers.get("Authorization"));
    const body = (await req.json()) as RequestBody;

    const { data: site, error: siteError } = await supabaseAdmin.from("sites").select("*").eq("id", body.site_id).single();
    if (siteError || !site) {
      return new Response(JSON.stringify({ success: false, error: "Site not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: membership } = await supabaseAdmin.from("site_members").select("role").eq("site_id", body.site_id).eq("user_id", user.id).single();
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return new Response(JSON.stringify({ success: false, error: "Admin access required for site orchestration" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: existingConfig } = await supabaseAdmin.from("site_service_configs").select("*").eq("site_id", body.site_id).maybeSingle();

    if (body.action === "rollback") {
      if (!body.deployment_id) {
        return new Response(JSON.stringify({ success: false, error: "deployment_id is required for rollback" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: sourceDeployment, error: sourceError } = await supabaseAdmin.from("site_service_deployments").select("*").eq("id", body.deployment_id).eq("site_id", body.site_id).single();
      if (sourceError || !sourceDeployment || !existingConfig) {
        return new Response(JSON.stringify({ success: false, error: "Deployment snapshot not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: rollbackDeployment } = await restoreSnapshot(supabaseAdmin, body.site_id, existingConfig.id, sourceDeployment, existingConfig, user.id, "INFO: Manual rollback requested.", "rolled_back");
      return new Response(JSON.stringify({ success: true, deployment: rollbackDeployment }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!site.document_root) {
      site.document_root = buildDocumentRoot(site.domain, body.config?.runtime_environment ?? existingConfig?.runtime_environment ?? "production");
    }

    const mergedConfig = mergeConfig(site, existingConfig, body.config);
    site.document_root = site.document_root || buildDocumentRoot(site.domain, mergedConfig.runtime_environment);

    const validation = validateConfig(site, mergedConfig);
    const generatedVhost = renderVhostConfig(site, mergedConfig);
    const generatedPool = renderPoolConfig(site, mergedConfig);
    const runtimeConfig = renderRuntimeConfig(mergedConfig);
    const testResult = testGeneratedConfig(mergedConfig, generatedVhost, generatedPool);
    const combinedTestOutput = [validation.output, testResult.output].filter(Boolean).join("\n");

    const { data: savedConfig, error: configError } = await supabaseAdmin
      .from("site_service_configs")
      .upsert({
        site_id: body.site_id,
        ...mergedConfig,
        generated_vhost_config: generatedVhost,
        generated_pool_config: generatedPool,
        last_validation_output: validation.output,
        last_test_output: combinedTestOutput,
        last_tested_at: new Date().toISOString(),
        last_test_passed: validation.isValid && testResult.passed,
        last_deployment_status: validation.isValid && testResult.passed ? "validated" : "failed",
      }, { onConflict: "site_id" })
      .select("*")
      .single();

    if (configError) {
      return new Response(JSON.stringify({ success: false, error: configError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabaseAdmin.from("sites").update({
      document_root: site.document_root,
      php_version: mergedConfig.php_fpm_enabled ? mergedConfig.php_fpm_version : null,
      status: validation.isValid && testResult.passed ? site.status : "error",
    }).eq("id", body.site_id);

    if (body.action === "preview" || body.action === "provision" || body.action === "test") {
      return new Response(JSON.stringify({
        success: validation.isValid && testResult.passed,
        validation_output: combinedTestOutput,
        generated_vhost_config: generatedVhost,
        generated_pool_config: generatedPool,
        runtime_config: runtimeConfig,
        config: savedConfig,
      }), {
        status: validation.isValid && testResult.passed ? 200 : 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!validation.isValid || !testResult.passed) {
      const { data: failedDeployment } = await supabaseAdmin
        .from("site_service_deployments")
        .insert({
          site_id: body.site_id,
          config_id: savedConfig.id,
          action: "deploy",
          status: "failed",
          validation_output: combinedTestOutput,
          orchestration_log: "Config test failed before apply; deployment aborted.",
          snapshot_vhost_config: existingConfig?.generated_vhost_config ?? null,
          snapshot_pool_config: existingConfig?.generated_pool_config ?? null,
          applied_vhost_config: generatedVhost,
          applied_pool_config: generatedPool,
          created_by: user.id,
        })
        .select("*")
        .single();

      let rollbackDeployment = null;
      const { data: previousDeployment } = await supabaseAdmin
        .from("site_service_deployments")
        .select("*")
        .eq("site_id", body.site_id)
        .eq("status", "deployed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (previousDeployment) {
        const rollbackResult = await restoreSnapshot(supabaseAdmin, body.site_id, savedConfig.id, previousDeployment, existingConfig, user.id, "INFO: Automatic rollback triggered after failed config test.", "failed");
        rollbackDeployment = rollbackResult.data;
      }

      return new Response(JSON.stringify({
        success: false,
        deployment: failedDeployment,
        rollback_deployment: rollbackDeployment,
        validation_output: combinedTestOutput,
        generated_vhost_config: generatedVhost,
        generated_pool_config: generatedPool,
        runtime_config: runtimeConfig,
        config: { ...savedConfig, last_deployment_status: "failed" },
      }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const orchestrationLog = [
      `Rendered ${mergedConfig.web_server} virtual host template for ${site.domain}.`,
      mergedConfig.php_fpm_enabled ? `Rendered PHP-FPM pool ${mergedConfig.php_fpm_pool_name} for PHP ${mergedConfig.php_fpm_version}.` : "PHP-FPM disabled for this site.",
      "Ran config test before apply.",
      `Reload sequence simulated: ${mergedConfig.web_server} reload -> php-fpm reload.`,
      `Logs available at ${mergedConfig.access_log_path} and ${mergedConfig.error_log_path}.`,
    ].join("\n");

    const { data: deployment } = await supabaseAdmin
      .from("site_service_deployments")
      .insert({
        site_id: body.site_id,
        config_id: savedConfig.id,
        action: "deploy",
        status: "deployed",
        validation_output: combinedTestOutput,
        orchestration_log: orchestrationLog,
        snapshot_vhost_config: existingConfig?.generated_vhost_config ?? null,
        snapshot_pool_config: existingConfig?.generated_pool_config ?? null,
        applied_vhost_config: generatedVhost,
        applied_pool_config: generatedPool,
        created_by: user.id,
      })
      .select("*")
      .single();

    await supabaseAdmin.from("site_service_configs").update({
      generated_vhost_config: generatedVhost,
      generated_pool_config: generatedPool,
      last_validation_output: validation.output,
      last_test_output: combinedTestOutput,
      last_tested_at: new Date().toISOString(),
      last_test_passed: true,
      last_deployment_status: "deployed",
      last_applied_at: new Date().toISOString(),
    }).eq("id", savedConfig.id);

    await supabaseAdmin.from("site_service_logs").insert(buildSampleLogs(site, savedConfig.id));

    return new Response(JSON.stringify({
      success: true,
      deployment,
      validation_output: combinedTestOutput,
      generated_vhost_config: generatedVhost,
      generated_pool_config: generatedPool,
      runtime_config: runtimeConfig,
      orchestration_log: orchestrationLog,
      config: { ...savedConfig, last_deployment_status: "deployed", last_test_output: combinedTestOutput, last_test_passed: true },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
