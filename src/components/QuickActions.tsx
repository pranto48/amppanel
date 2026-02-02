import { useState } from "react";
import { 
  Plus, 
  Upload, 
  RefreshCw, 
  Download, 
  Shield, 
  Zap,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddSiteDialog } from "@/components/AddSiteDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QuickActionsProps {
  onNavigate?: (section: string) => void;
}

const colorClasses = {
  primary: "hover:border-primary/50 hover:bg-primary/5 group-hover:text-primary",
  success: "hover:border-success/50 hover:bg-success/5 group-hover:text-success",
  warning: "hover:border-warning/50 hover:bg-warning/5 group-hover:text-warning",
  destructive: "hover:border-destructive/50 hover:bg-destructive/5 group-hover:text-destructive",
  info: "hover:border-info/50 hover:bg-info/5 group-hover:text-info",
};

export const QuickActions = ({ onNavigate }: QuickActionsProps) => {
  const { toast } = useToast();
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [optimizeDialogOpen, setOptimizeDialogOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState(0);

  const handleRestart = async () => {
    setIsRestarting(true);
    // Simulate restart
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRestarting(false);
    setRestartDialogOpen(false);
    toast({
      title: "Services Restarted",
      description: "All services have been restarted successfully.",
    });
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setOptimizeProgress(0);
    
    // Simulate optimization process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setOptimizeProgress(i);
    }
    
    setIsOptimizing(false);
    setOptimizeDialogOpen(false);
    setOptimizeProgress(0);
    toast({
      title: "Optimization Complete",
      description: "System has been optimized. Cache cleared, databases optimized.",
    });
  };

  const actions = [
    { 
      id: "add-site", 
      label: "Add Site", 
      icon: Plus, 
      color: "primary",
      isDialog: true 
    },
    { 
      id: "upload", 
      label: "Upload Files", 
      icon: Upload, 
      color: "info",
      onClick: () => onNavigate?.("files")
    },
    { 
      id: "backup", 
      label: "Create Backup", 
      icon: Download, 
      color: "success",
      onClick: () => onNavigate?.("backups")
    },
    { 
      id: "ssl", 
      label: "SSL Cert", 
      icon: Shield, 
      color: "warning",
      onClick: () => onNavigate?.("security")
    },
    { 
      id: "restart", 
      label: "Restart Services", 
      icon: RefreshCw, 
      color: "destructive",
      onClick: () => setRestartDialogOpen(true)
    },
    { 
      id: "optimize", 
      label: "Optimize", 
      icon: Zap, 
      color: "primary",
      onClick: () => setOptimizeDialogOpen(true)
    },
  ];

  return (
    <>
      <div className="glass-card rounded-xl p-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            
            if (action.isDialog && action.id === "add-site") {
              return (
                <AddSiteDialog key={action.id}>
                  <button
                    className={cn(
                      "group flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-secondary/30 transition-all duration-200 w-full",
                      colorClasses[action.color as keyof typeof colorClasses]
                    )}
                  >
                    <Icon className="w-6 h-6 text-muted-foreground transition-colors" />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {action.label}
                    </span>
                  </button>
                </AddSiteDialog>
              );
            }
            
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className={cn(
                  "group flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-secondary/30 transition-all duration-200",
                  colorClasses[action.color as keyof typeof colorClasses]
                )}
              >
                <Icon className="w-6 h-6 text-muted-foreground transition-colors" />
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Restart Services Dialog */}
      <AlertDialog open={restartDialogOpen} onOpenChange={setRestartDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-destructive" />
              Restart All Services
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will restart Apache, Nginx, MySQL, and other services. 
              Your sites may be briefly unavailable during the restart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestarting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleRestart();
              }}
              disabled={isRestarting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRestarting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restarting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart Services
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Optimize Dialog */}
      <Dialog open={optimizeDialogOpen} onOpenChange={setOptimizeDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              System Optimization
            </DialogTitle>
            <DialogDescription>
              Optimize your server by clearing caches, optimizing databases, and freeing up disk space.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Optimization Tasks</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Clear PHP OpCache
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Optimize MySQL databases
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Clear temporary files
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Rotate and compress logs
                </li>
              </ul>
            </div>
            
            {isOptimizing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground">{optimizeProgress}%</span>
                </div>
                <Progress value={optimizeProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOptimizeDialogOpen(false)}
              disabled={isOptimizing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="bg-primary"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Start Optimization
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
