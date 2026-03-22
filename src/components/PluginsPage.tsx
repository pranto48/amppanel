import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PluginMarketplace } from "./plugins/PluginMarketplace";
import { InstalledPlugins } from "./plugins/InstalledPlugins";
import { Store, Package, Mail, Shield, Server, Sparkles } from "lucide-react";

const featuredModules = [
  { title: "Web services", description: "Nginx, Apache, PHP runtimes, Node.js apps, SSL, and logs.", icon: Server },
  { title: "Mail stack", description: "Email, DKIM, queue, spam filters, SMTP relay, and webmail.", icon: Mail },
  { title: "Security & backup", description: "Firewall, Fail2Ban, backup engines, monitoring, and audit logs.", icon: Shield },
  { title: "Automation & AI", description: "Cron jobs, AI assistants, restore workflows, and scripted operations.", icon: Sparkles },
];

export function PluginsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {featuredModules.map((module) => {
          const Icon = module.icon;
          return (
            <div key={module.title} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /><h3 className="font-semibold">{module.title}</h3></div>
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </div>
          );
        })}
      </div>
      <Tabs defaultValue="marketplace" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="marketplace" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="installed" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Installed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="mt-6">
          <PluginMarketplace />
        </TabsContent>

        <TabsContent value="installed" className="mt-6">
          <InstalledPlugins />
        </TabsContent>
      </Tabs>
    </div>
  );
}
