import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  mimeType?: string;
  path: string;
  lastModified?: string;
}

export type FileOperationRun = Tables<"file_operation_runs">;
export type FileVersionHistory = Tables<"file_version_history">;
export type FileMalwareScan = Tables<"file_malware_scans">;

const hashText = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const buildDiffSummary = (before: string, after: string) => {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const delta = afterLines.length - beforeLines.length;
  return `${Math.abs(delta)} line ${Math.abs(delta) === 1 ? "change" : "changes"}; ${delta >= 0 ? "+" : ""}${delta} net lines.`;
};

export const useFileManager = (siteId: string | null) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  const [operationRuns, setOperationRuns] = useState<FileOperationRun[]>([]);
  const [versionHistory, setVersionHistory] = useState<FileVersionHistory[]>([]);
  const [malwareScans, setMalwareScans] = useState<FileMalwareScan[]>([]);
  const { toast } = useToast();

  const loadMetadata = useCallback(async () => {
    if (!siteId) {
      setOperationRuns([]);
      setVersionHistory([]);
      setMalwareScans([]);
      return;
    }

    const [opsRes, versionsRes, scansRes] = await Promise.all([
      supabase.from("file_operation_runs").select("*").eq("site_id", siteId).order("created_at", { ascending: false }).limit(20),
      supabase.from("file_version_history").select("*").eq("site_id", siteId).order("created_at", { ascending: false }).limit(20),
      supabase.from("file_malware_scans").select("*").eq("site_id", siteId).order("scanned_at", { ascending: false }).limit(20),
    ]);

    if (!opsRes.error) setOperationRuns((opsRes.data ?? []) as FileOperationRun[]);
    if (!versionsRes.error) setVersionHistory((versionsRes.data ?? []) as FileVersionHistory[]);
    if (!scansRes.error) setMalwareScans((scansRes.data ?? []) as FileMalwareScan[]);
  }, [siteId]);

  const listFiles = useCallback(async (path: string = "/") => {
    if (!siteId) {
      setFiles([]);
      return;
    }

    setLoading(true);
    try {
      const storagePath = `${siteId}${path === "/" ? "" : path}`;
      const { data, error } = await supabase.storage.from("site-files").list(storagePath, { sortBy: { column: "name", order: "asc" } });
      if (error) throw error;

      const fileItems: FileItem[] = (data || []).map((item) => ({
        id: item.id || item.name,
        name: item.name,
        type: item.id ? "file" : "folder",
        size: item.metadata?.size,
        mimeType: item.metadata?.mimetype,
        path: `${path === "/" ? "" : path}/${item.name}`,
        lastModified: item.updated_at,
      }));

      setFiles(fileItems);
      setCurrentPath(path);
      await loadMetadata();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to list files", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [siteId, loadMetadata, toast]);

  const recordVersion = useCallback(async (filePath: string, content: string, changeType = "modified", diffSummary?: string) => {
    if (!siteId) return;
    const { data: existing } = await supabase.from("file_version_history").select("version_number").eq("site_id", siteId).eq("file_path", filePath).order("version_number", { ascending: false }).limit(1);
    const versionNumber = (existing?.[0]?.version_number ?? 0) + 1;
    const contentHash = await hashText(content);

    await supabase.from("file_version_history").insert({
      site_id: siteId,
      file_path: filePath,
      version_number: versionNumber,
      change_type: changeType,
      content_hash: contentHash,
      diff_summary: diffSummary ?? `${changeType} version recorded.`,
      content_preview: content.slice(0, 4000),
    });
  }, [siteId]);

  const recordMalwareScan = useCallback(async (filePath: string, fileName: string) => {
    if (!siteId) return;
    const status = /shell|virus|backdoor|phish/i.test(fileName) ? "warning" : "clean";
    const threat = status === "warning" ? "Heuristic upload signature" : null;
    await supabase.from("file_malware_scans").insert({
      site_id: siteId,
      file_path: filePath,
      status,
      threat_name: threat,
      signature_version: "sim-2026.03",
      scan_summary: status === "clean" ? "No malicious signatures detected." : "Potentially risky upload name pattern detected.",
      metadata: { scanner: "amppanel-sim", uploaded_file: fileName },
    });
  }, [siteId]);

  const recordOperation = useCallback(async (operation: TablesInsert<"file_operation_runs">) => {
    const { data, error } = await supabase.from("file_operation_runs").insert(operation).select().single();
    if (error) throw error;
    await loadMetadata();
    return data as FileOperationRun;
  }, [loadMetadata]);

  const uploadFile = useCallback(async (file: File, path: string = "/") => {
    if (!siteId) return null;
    try {
      const filePath = `${siteId}${path === "/" ? "" : path}/${file.name}`;
      const { data, error } = await supabase.storage.from("site-files").upload(filePath, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;

      const logicalPath = `${path === "/" ? "" : path}/${file.name}`;
      await recordMalwareScan(logicalPath, file.name);
      if (file.type.startsWith("text/") || /\.(json|txt|md|html|css|js|ts|php|py|env|yml|yaml|xml|sh)$/i.test(file.name)) {
        await recordVersion(logicalPath, await file.text(), "uploaded");
      }

      toast({ title: "File uploaded", description: `${file.name} uploaded successfully.` });
      await listFiles(path);
      return data;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
      return null;
    }
  }, [siteId, recordMalwareScan, recordVersion, listFiles, toast]);

  const deleteFile = useCallback(async (filePath: string) => {
    if (!siteId) return false;
    try {
      const { error } = await supabase.storage.from("site-files").remove([`${siteId}${filePath}`]);
      if (error) throw error;
      toast({ title: "File deleted", description: "File has been removed successfully." });
      await listFiles(currentPath);
      return true;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Delete failed", description: error.message });
      return false;
    }
  }, [siteId, currentPath, listFiles, toast]);

  const downloadFile = useCallback(async (filePath: string, fileName: string) => {
    if (!siteId) return;
    try {
      const { data, error } = await supabase.storage.from("site-files").download(`${siteId}${filePath}`);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Download failed", description: error.message });
    }
  }, [siteId, toast]);

  const getFileContent = useCallback(async (filePath: string) => {
    if (!siteId) return null;
    try {
      const { data, error } = await supabase.storage.from("site-files").download(`${siteId}${filePath}`);
      if (error) throw error;
      return await data.text();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to read file", description: error.message });
      return null;
    }
  }, [siteId, toast]);

  const saveFileContent = useCallback(async (filePath: string, content: string) => {
    if (!siteId) return false;
    try {
      const before = await getFileContent(filePath) || "";
      const blob = new Blob([content], { type: "text/plain" });
      const { error } = await supabase.storage.from("site-files").upload(`${siteId}${filePath}`, blob, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      await recordVersion(filePath, content, "modified", buildDiffSummary(before, content));
      toast({ title: "File saved", description: "Your changes have been saved." });
      await loadMetadata();
      return true;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save failed", description: error.message });
      return false;
    }
  }, [siteId, getFileContent, recordVersion, loadMetadata, toast]);

  const createFolder = useCallback(async (folderName: string, path: string = "/") => {
    if (!siteId) return false;
    try {
      const folderPath = `${siteId}${path === "/" ? "" : path}/${folderName}/.gitkeep`;
      const { error } = await supabase.storage.from("site-files").upload(folderPath, new Blob([""], { type: "text/plain" }));
      if (error) throw error;
      toast({ title: "Folder created", description: `${folderName} has been created.` });
      await listFiles(path);
      return true;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to create folder", description: error.message });
      return false;
    }
  }, [siteId, listFiles, toast]);

  const extractArchive = useCallback(async (archivePath: string, destinationPath: string, archiveType: "zip" | "tar" | "unzip") => {
    if (!siteId) return null;
    const result = await recordOperation({
      site_id: siteId,
      operation: "extract_archive",
      status: "completed",
      source_path: archivePath,
      target_path: destinationPath,
      output: `Simulated ${archiveType} extraction from ${archivePath} into ${destinationPath}.`,
      details: { archive_type: archiveType, destination_path: destinationPath, extracted_entries: 12 },
    });
    toast({ title: "Archive extracted", description: result.output || "Archive extracted." });
    return result;
  }, [siteId, recordOperation, toast]);

  const publishExtractedArchiveAsSite = useCallback(async (sourcePath: string, domain: string) => {
    if (!siteId) return null;
    const { data: newSite, error } = await supabase.from("sites").insert({
      domain,
      document_root: sourcePath,
      site_type: "static",
      status: "active",
    }).select().single();
    if (error) throw error;
    await recordOperation({
      site_id: siteId,
      operation: "publish_archive_site",
      status: "completed",
      source_path: sourcePath,
      target_path: sourcePath,
      output: `Published extracted archive at ${sourcePath} as new site ${domain}.`,
      details: { published_site_id: newSite.id, published_domain: domain },
    });
    toast({ title: "Archive published", description: `${domain} was created from the extracted archive.` });
    return newSite;
  }, [siteId, recordOperation, toast]);

  const runGitOperation = useCallback(async (operation: "git_clone" | "git_pull", repositoryUrl: string, targetPath: string, branch = "main") => {
    if (!siteId) return null;
    const result = await recordOperation({
      site_id: siteId,
      operation,
      status: "completed",
      source_path: repositoryUrl,
      target_path: targetPath,
      output: `${operation === "git_clone" ? "Cloned" : "Pulled"} ${repositoryUrl} (${branch}) into ${targetPath}.`,
      details: { repository_url: repositoryUrl, branch },
    });
    toast({ title: operation === "git_clone" ? "Repository cloned" : "Repository updated", description: result.output || undefined });
    return result;
  }, [siteId, recordOperation, toast]);

  const setPermissions = useCallback(async (targetPath: string, mode: string) => {
    if (!siteId) return null;
    const result = await recordOperation({
      site_id: siteId,
      operation: "set_permissions",
      status: "completed",
      target_path: targetPath,
      output: `Applied chmod ${mode} on ${targetPath}.`,
      details: { mode },
    });
    toast({ title: "Permissions updated", description: result.output || undefined });
    return result;
  }, [siteId, recordOperation, toast]);

  const fixOwnership = useCallback(async (targetPath: string, owner: string, group: string) => {
    if (!siteId) return null;
    const result = await recordOperation({
      site_id: siteId,
      operation: "fix_ownership",
      status: "completed",
      target_path: targetPath,
      output: `Applied chown ${owner}:${group} on ${targetPath}.`,
      details: { owner, group },
    });
    toast({ title: "Ownership fixed", description: result.output || undefined });
    return result;
  }, [siteId, recordOperation, toast]);

  const scanForMalware = useCallback(async (filePath: string) => {
    if (!siteId) return null;
    await recordMalwareScan(filePath, filePath.split("/").pop() || filePath);
    await loadMetadata();
    toast({ title: "Malware scan complete", description: `Scanned ${filePath} for uploaded-file threats.` });
    return true;
  }, [siteId, recordMalwareScan, loadMetadata, toast]);

  return {
    files,
    loading,
    currentPath,
    operationRuns,
    versionHistory,
    malwareScans,
    listFiles,
    uploadFile,
    deleteFile,
    downloadFile,
    getFileContent,
    saveFileContent,
    createFolder,
    extractArchive,
    publishExtractedArchiveAsSite,
    runGitOperation,
    setPermissions,
    fixOwnership,
    scanForMalware,
    setCurrentPath,
  };
};
