import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  mimeType?: string;
  path: string;
  lastModified?: string;
}

export const useFileManager = (siteId: string | null) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  const { toast } = useToast();

  const listFiles = useCallback(async (path: string = "/") => {
    if (!siteId) {
      setFiles([]);
      return;
    }

    setLoading(true);
    try {
      const storagePath = `${siteId}${path === "/" ? "" : path}`;
      
      const { data, error } = await supabase.storage
        .from("site-files")
        .list(storagePath, {
          sortBy: { column: "name", order: "asc" },
        });

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
    } catch (error: any) {
      console.error("Error listing files:", error);
      toast({
        variant: "destructive",
        title: "Failed to list files",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [siteId, toast]);

  const uploadFile = useCallback(async (file: File, path: string = "/") => {
    if (!siteId) return null;

    try {
      const filePath = `${siteId}${path === "/" ? "" : path}/${file.name}`;
      
      const { data, error } = await supabase.storage
        .from("site-files")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      toast({
        title: "File uploaded",
        description: `${file.name} uploaded successfully.`,
      });

      await listFiles(path);
      return data;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
      return null;
    }
  }, [siteId, listFiles, toast]);

  const deleteFile = useCallback(async (filePath: string) => {
    if (!siteId) return false;

    try {
      const storagePath = `${siteId}${filePath}`;
      
      const { error } = await supabase.storage
        .from("site-files")
        .remove([storagePath]);

      if (error) throw error;

      toast({
        title: "File deleted",
        description: "File has been removed successfully.",
      });

      await listFiles(currentPath);
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
      return false;
    }
  }, [siteId, currentPath, listFiles, toast]);

  const downloadFile = useCallback(async (filePath: string, fileName: string) => {
    if (!siteId) return;

    try {
      const storagePath = `${siteId}${filePath}`;
      
      const { data, error } = await supabase.storage
        .from("site-files")
        .download(storagePath);

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
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error.message,
      });
    }
  }, [siteId, toast]);

  const getFileContent = useCallback(async (filePath: string): Promise<string | null> => {
    if (!siteId) return null;

    try {
      const storagePath = `${siteId}${filePath}`;
      
      const { data, error } = await supabase.storage
        .from("site-files")
        .download(storagePath);

      if (error) throw error;

      return await data.text();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to read file",
        description: error.message,
      });
      return null;
    }
  }, [siteId, toast]);

  const saveFileContent = useCallback(async (filePath: string, content: string): Promise<boolean> => {
    if (!siteId) return false;

    try {
      const storagePath = `${siteId}${filePath}`;
      const blob = new Blob([content], { type: "text/plain" });
      
      const { error } = await supabase.storage
        .from("site-files")
        .upload(storagePath, blob, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      toast({
        title: "File saved",
        description: "Your changes have been saved.",
      });

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error.message,
      });
      return false;
    }
  }, [siteId, toast]);

  const createFolder = useCallback(async (folderName: string, path: string = "/"): Promise<boolean> => {
    if (!siteId) return false;

    try {
      // Create an empty .gitkeep file to represent the folder
      const folderPath = `${siteId}${path === "/" ? "" : path}/${folderName}/.gitkeep`;
      const blob = new Blob([""], { type: "text/plain" });
      
      const { error } = await supabase.storage
        .from("site-files")
        .upload(folderPath, blob);

      if (error) throw error;

      toast({
        title: "Folder created",
        description: `${folderName} has been created.`,
      });

      await listFiles(path);
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create folder",
        description: error.message,
      });
      return false;
    }
  }, [siteId, listFiles, toast]);

  return {
    files,
    loading,
    currentPath,
    listFiles,
    uploadFile,
    deleteFile,
    downloadFile,
    getFileContent,
    saveFileContent,
    createFolder,
    setCurrentPath,
  };
};
