import { 
  Plus, 
  Upload, 
  RefreshCw, 
  Download, 
  Shield, 
  Zap 
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { id: "add-site", label: "Add Site", icon: Plus, color: "primary" },
  { id: "upload", label: "Upload Files", icon: Upload, color: "info" },
  { id: "backup", label: "Create Backup", icon: Download, color: "success" },
  { id: "ssl", label: "SSL Cert", icon: Shield, color: "warning" },
  { id: "restart", label: "Restart Services", icon: RefreshCw, color: "destructive" },
  { id: "optimize", label: "Optimize", icon: Zap, color: "primary" },
];

const colorClasses = {
  primary: "hover:border-primary/50 hover:bg-primary/5 group-hover:text-primary",
  success: "hover:border-success/50 hover:bg-success/5 group-hover:text-success",
  warning: "hover:border-warning/50 hover:bg-warning/5 group-hover:text-warning",
  destructive: "hover:border-destructive/50 hover:bg-destructive/5 group-hover:text-destructive",
  info: "hover:border-info/50 hover:bg-info/5 group-hover:text-info",
};

export const QuickActions = () => {
  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
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
  );
};
