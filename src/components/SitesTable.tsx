import { Globe, MoreVertical, ExternalLink, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Site {
  id: string;
  domain: string;
  type: string;
  status: "active" | "pending" | "error";
  ssl: boolean;
  php: string;
  traffic: string;
}

const sites: Site[] = [
  { id: "1", domain: "example.com", type: "WordPress", status: "active", ssl: true, php: "8.2", traffic: "12.5k" },
  { id: "2", domain: "myapp.io", type: "Node.js", status: "active", ssl: true, php: "-", traffic: "8.2k" },
  { id: "3", domain: "blog.dev", type: "Static", status: "pending", ssl: false, php: "-", traffic: "2.1k" },
  { id: "4", domain: "api.service.com", type: "Python", status: "active", ssl: true, php: "-", traffic: "45.8k" },
  { id: "5", domain: "shop.store", type: "WooCommerce", status: "error", ssl: true, php: "8.1", traffic: "5.3k" },
];

const statusConfig = {
  active: { icon: CheckCircle, class: "text-success", label: "Active" },
  pending: { icon: Clock, class: "text-warning", label: "Pending" },
  error: { icon: AlertCircle, class: "text-destructive", label: "Error" },
};

export const SitesTable = () => {
  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Managed Sites</h3>
        <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          Add Site
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Domain</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SSL</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">PHP</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Traffic</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sites.map((site) => {
              const StatusIcon = statusConfig[site.status].icon;
              return (
                <tr key={site.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{site.domain}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                      {site.type}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn("w-4 h-4", statusConfig[site.status].class)} />
                      <span className={cn("text-sm", statusConfig[site.status].class)}>
                        {statusConfig[site.status].label}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-full",
                      site.ssl ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      {site.ssl ? "Secured" : "None"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{site.php}</td>
                  <td className="px-5 py-4 text-sm text-foreground font-medium">{site.traffic}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
