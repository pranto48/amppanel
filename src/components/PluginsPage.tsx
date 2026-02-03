import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PluginMarketplace } from "./plugins/PluginMarketplace";
import { InstalledPlugins } from "./plugins/InstalledPlugins";
import { Store, Package } from "lucide-react";

export function PluginsPage() {
  return (
    <div className="space-y-6">
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
