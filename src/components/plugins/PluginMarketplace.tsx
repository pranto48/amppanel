import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlugins, useInstalledPlugins, useInstallPlugin, useUninstallPlugin, usePluginHealthCheck, PluginCategory } from "@/hooks/usePlugins";
import { PluginCard } from "./PluginCard";
import { Search, Store, Package, Globe, Mail, Upload, Network, Archive, Database, Folder, Shield, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categories: { value: PluginCategory | 'all'; label: string; icon: typeof Package }[] = [
  { value: 'all', label: 'All', icon: Store },
  { value: 'web_server', label: 'Web Server', icon: Globe },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'ftp', label: 'FTP', icon: Upload },
  { value: 'dns', label: 'DNS', icon: Network },
  { value: 'backup', label: 'Backup', icon: Archive },
  { value: 'database', label: 'Database', icon: Database },
  { value: 'file_manager', label: 'File Manager', icon: Folder },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'monitoring', label: 'Monitoring', icon: Activity },
];

export function PluginMarketplace() {
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const { data: plugins, isLoading: pluginsLoading } = usePlugins(
    selectedCategory === 'all' ? undefined : selectedCategory
  );
  const { data: installedPlugins } = useInstalledPlugins();
  const installPlugin = useInstallPlugin();
  const uninstallPlugin = useUninstallPlugin();
  const healthCheck = usePluginHealthCheck();

  const installedMap = new Map(
    installedPlugins?.map(ip => [ip.plugin_id, ip]) || []
  );

  const filteredPlugins = plugins?.filter(plugin => 
    plugin.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Plugin Marketplace</h2>
          <p className="text-muted-foreground">Install and manage server services</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as PluginCategory | 'all')}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="w-4 h-4 mr-2" />
                {cat.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {pluginsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredPlugins?.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">No plugins found</h3>
              <p className="text-muted-foreground">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlugins?.map(plugin => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  installedPlugin={installedMap.get(plugin.id)}
                  onInstall={(pluginId) => installPlugin.mutate({ pluginId })}
                  onUninstall={(id) => uninstallPlugin.mutate(id)}
                  onHealthCheck={(id) => healthCheck.mutate(id)}
                  isInstalling={installPlugin.isPending && installPlugin.variables?.pluginId === plugin.id}
                  isUninstalling={uninstallPlugin.isPending && uninstallPlugin.variables === installedMap.get(plugin.id)?.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
