import { useState } from "react";
import { X, Download, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFirmwareUpdate } from "@/hooks/useFirmwareUpdate";

export const UpdateBanner = () => {
  const {
    updateInfo,
    isUpdating,
    updateProgress,
    triggerUpdate,
    dismissUpdate,
    isDismissed,
  } = useFirmwareUpdate();
  const [isVisible, setIsVisible] = useState(true);

  if (!updateInfo?.hasUpdate || isDismissed || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    dismissUpdate();
    setIsVisible(false);
  };

  return (
    <div className="bg-gradient-to-r from-primary/20 via-info/20 to-primary/20 border-b border-primary/30 px-4 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 animate-pulse">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              <span className="text-primary">New Update Available!</span>
              {" "}Version {updateInfo.latestVersion} is ready
            </p>
            <p className="text-xs text-muted-foreground">
              {updateInfo.releaseName || "New features and improvements available"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isUpdating ? (
            <div className="flex items-center gap-3 min-w-[200px]">
              <Progress value={updateProgress} className="h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {updateProgress}%
              </span>
            </div>
          ) : (
            <>
              {updateInfo.releaseUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => window.open(updateInfo.releaseUrl, "_blank")}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  View Changes
                </Button>
              )}
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={triggerUpdate}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Update Now
              </Button>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
