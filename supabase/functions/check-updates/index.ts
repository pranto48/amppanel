import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GITHUB_REPO = "pranto48/amppanel";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: Array<{
    name: string;
    download_count: number;
    size: number;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { currentVersion } = await req.json();
    
    console.log("Checking for updates, current version:", currentVersion);

    // Fetch latest release from GitHub
    const releaseResponse = await fetch(`${GITHUB_API_URL}/releases/latest`, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": "AmpPanel-Update-Checker",
      },
    });

    if (!releaseResponse.ok) {
      // If no releases, try to get latest tag
      const tagsResponse = await fetch(`${GITHUB_API_URL}/tags`, {
        headers: {
          "Accept": "application/vnd.github+json",
          "User-Agent": "AmpPanel-Update-Checker",
        },
      });

      if (!tagsResponse.ok) {
        console.log("No releases or tags found");
        return new Response(
          JSON.stringify({
            success: true,
            hasUpdate: false,
            message: "No releases found",
            currentVersion,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tags = await tagsResponse.json();
      if (tags.length === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            hasUpdate: false,
            message: "No tags found",
            currentVersion,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const latestTag = tags[0].name;
      const hasUpdate = compareVersions(latestTag, currentVersion) > 0;

      return new Response(
        JSON.stringify({
          success: true,
          hasUpdate,
          currentVersion,
          latestVersion: latestTag,
          releaseUrl: `https://github.com/${GITHUB_REPO}/releases/tag/${latestTag}`,
          changelog: null,
          publishedAt: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const release: GitHubRelease = await releaseResponse.json();
    const latestVersion = release.tag_name;
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

    console.log(`Latest version: ${latestVersion}, Has update: ${hasUpdate}`);

    return new Response(
      JSON.stringify({
        success: true,
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseName: release.name,
        changelog: release.body,
        publishedAt: release.published_at,
        releaseUrl: release.html_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error checking for updates:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to check for updates";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Compare semantic versions (e.g., v1.2.3 or 1.2.3)
function compareVersions(v1: string, v2: string): number {
  // Remove 'v' prefix if present
  const normalize = (v: string) => v.replace(/^v/, "").split(".").map(Number);
  
  const parts1 = normalize(v1);
  const parts2 = normalize(v2);
  
  const maxLen = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  
  return 0;
}
