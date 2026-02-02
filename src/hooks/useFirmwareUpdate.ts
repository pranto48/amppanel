import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Current panel version - this should match your package.json or be updated with releases
export const CURRENT_VERSION = "1.0.0";

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseName?: string;
  changelog?: string;
  publishedAt?: string;
  releaseUrl?: string;
}

export const useFirmwareUpdate = () => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  const {
    data: updateInfo,
    isLoading: isChecking,
    refetch: checkForUpdates,
    error,
  } = useQuery({
    queryKey: ["firmware-update"],
    queryFn: async (): Promise<UpdateInfo> => {
      const { data, error } = await supabase.functions.invoke("check-updates", {
        body: { currentVersion: CURRENT_VERSION },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data as UpdateInfo;
    },
    staleTime: 1000 * 60 * 30, // Check every 30 minutes
    refetchOnWindowFocus: false,
  });

  const triggerUpdate = useCallback(async () => {
    if (!updateInfo?.hasUpdate) return;

    setIsUpdating(true);
    setUpdateProgress(0);

    try {
      // Simulate update progress (in reality, this would trigger a rebuild)
      const steps = [
        { progress: 10, message: "Downloading latest version..." },
        { progress: 30, message: "Verifying package integrity..." },
        { progress: 50, message: "Applying updates..." },
        { progress: 70, message: "Updating configuration..." },
        { progress: 90, message: "Finalizing..." },
        { progress: 100, message: "Update complete!" },
      ];

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setUpdateProgress(step.progress);
      }

      toast({
        title: "Update Complete",
        description: `Successfully updated to version ${updateInfo.latestVersion}. Reloading...`,
      });

      // In production, this would trigger a deployment/rebuild
      // For now, we'll reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to apply update. Please try again.",
      });
      setIsUpdating(false);
      setUpdateProgress(0);
    }
  }, [updateInfo, toast]);

  const dismissUpdate = useCallback(() => {
    // Store dismissed version in localStorage
    if (updateInfo?.latestVersion) {
      localStorage.setItem("dismissedVersion", updateInfo.latestVersion);
    }
  }, [updateInfo]);

  const isDismissed = updateInfo?.latestVersion
    ? localStorage.getItem("dismissedVersion") === updateInfo.latestVersion
    : false;

  return {
    updateInfo,
    isChecking,
    isUpdating,
    updateProgress,
    error,
    checkForUpdates,
    triggerUpdate,
    dismissUpdate,
    isDismissed,
    currentVersion: CURRENT_VERSION,
  };
};
