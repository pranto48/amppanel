import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSites } from "@/hooks/useSites";
import { Server } from "lucide-react";

interface SiteMetricsFilterProps {
  selectedSiteId: string | undefined;
  onSiteChange: (siteId: string | undefined) => void;
}

export const SiteMetricsFilter = ({ selectedSiteId, onSiteChange }: SiteMetricsFilterProps) => {
  const { data: sites, isLoading } = useSites();

  return (
    <div className="flex items-center gap-2">
      <Server className="w-4 h-4 text-muted-foreground" />
      <Select
        value={selectedSiteId || "all"}
        onValueChange={(value) => onSiteChange(value === "all" ? undefined : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All Servers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Servers</SelectItem>
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading sites...</SelectItem>
          ) : (
            sites?.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.domain}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
