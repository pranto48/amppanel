import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  percentage: number;
  trend?: "up" | "down" | "neutral";
  color: "primary" | "success" | "warning" | "destructive" | "info";
}

const colorClasses = {
  primary: {
    icon: "text-primary",
    bg: "bg-primary/10",
    progress: "bg-primary",
    glow: "shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]",
  },
  success: {
    icon: "text-success",
    bg: "bg-success/10",
    progress: "bg-success",
    glow: "shadow-[0_0_20px_-5px_hsl(var(--success)/0.4)]",
  },
  warning: {
    icon: "text-warning",
    bg: "bg-warning/10",
    progress: "bg-warning",
    glow: "shadow-[0_0_20px_-5px_hsl(var(--warning)/0.4)]",
  },
  destructive: {
    icon: "text-destructive",
    bg: "bg-destructive/10",
    progress: "bg-destructive",
    glow: "shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.4)]",
  },
  info: {
    icon: "text-info",
    bg: "bg-info/10",
    progress: "bg-info",
    glow: "shadow-[0_0_20px_-5px_hsl(var(--info)/0.4)]",
  },
};

export const StatCard = ({ title, value, subtitle, icon: Icon, percentage, color }: StatCardProps) => {
  const colors = colorClasses[color];

  return (
    <div className={cn("glass-card rounded-xl p-5 animate-fade-in hover:scale-[1.02] transition-transform duration-300", colors.glow)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl", colors.bg)}>
          <Icon className={cn("w-6 h-6", colors.icon)} />
        </div>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", colors.bg, colors.icon)}>
          {percentage}%
        </span>
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", colors.progress)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
