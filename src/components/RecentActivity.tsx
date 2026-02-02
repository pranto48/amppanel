import { CheckCircle, AlertTriangle, Info, Clock, Shield, Database, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "success" | "warning" | "info" | "security";
  message: string;
  time: string;
  icon: typeof CheckCircle;
}

const activities: Activity[] = [
  { id: "1", type: "success", message: "SSL certificate renewed for example.com", time: "2 min ago", icon: Shield },
  { id: "2", type: "info", message: "Database backup completed successfully", time: "15 min ago", icon: Database },
  { id: "3", type: "warning", message: "High memory usage detected (85%)", time: "32 min ago", icon: AlertTriangle },
  { id: "4", type: "success", message: "New site myapp.io deployed", time: "1 hour ago", icon: Globe },
  { id: "5", type: "security", message: "3 failed login attempts blocked", time: "2 hours ago", icon: Shield },
  { id: "6", type: "info", message: "System updates available", time: "3 hours ago", icon: Info },
];

const typeConfig = {
  success: { class: "bg-success/10 text-success border-success/20" },
  warning: { class: "bg-warning/10 text-warning border-warning/20" },
  info: { class: "bg-info/10 text-info border-info/20" },
  security: { class: "bg-primary/10 text-primary border-primary/20" },
};

export const RecentActivity = () => {
  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div 
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className={cn(
                "p-2 rounded-lg border",
                typeConfig[activity.type].class
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.message}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
