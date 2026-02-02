import { Server, Database, Mail, Shield, RefreshCw, Power } from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  icon: typeof Server;
  status: "running" | "stopped" | "restarting";
  version: string;
  memory: string;
}

const services: Service[] = [
  { id: "nginx", name: "Nginx", icon: Server, status: "running", version: "1.24.0", memory: "124 MB" },
  { id: "mysql", name: "MySQL", icon: Database, status: "running", version: "8.0.35", memory: "512 MB" },
  { id: "php-fpm", name: "PHP-FPM", icon: Server, status: "running", version: "8.2.12", memory: "256 MB" },
  { id: "redis", name: "Redis", icon: Database, status: "running", version: "7.2.3", memory: "64 MB" },
  { id: "postfix", name: "Postfix", icon: Mail, status: "stopped", version: "3.7.6", memory: "-" },
  { id: "fail2ban", name: "Fail2ban", icon: Shield, status: "running", version: "1.0.2", memory: "32 MB" },
];

const statusConfig = {
  running: { class: "bg-success", label: "Running" },
  stopped: { class: "bg-muted-foreground", label: "Stopped" },
  restarting: { class: "bg-warning animate-pulse", label: "Restarting" },
};

export const SystemServices = () => {
  return (
    <div className="glass-card rounded-xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground">System Services</h3>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div 
              key={service.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{service.name}</p>
                  <p className="text-xs text-muted-foreground">v{service.version}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-foreground">{service.memory}</p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", statusConfig[service.status].class)} />
                    <span className="text-xs text-muted-foreground">{statusConfig[service.status].label}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Restart">
                    <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-warning" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Stop/Start">
                    <Power className={cn(
                      "w-4 h-4",
                      service.status === "running" ? "text-success" : "text-muted-foreground"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
