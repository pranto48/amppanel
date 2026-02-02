import { useState } from "react";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  LogIn,
  LogOut,
  Globe,
  Database,
  HardDrive,
  FileText,
  Users,
  Shield,
  Settings,
  Key,
  AlertTriangle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useActivityLogs, ActivityType } from "@/hooks/useActivityLogs";
import { useSites } from "@/hooks/useSites";
import { formatDistanceToNow } from "date-fns";

const activityConfig: Record<
  ActivityType,
  { icon: typeof Activity; color: string; bgColor: string }
> = {
  login: { icon: LogIn, color: "text-success", bgColor: "bg-success/20" },
  logout: { icon: LogOut, color: "text-muted-foreground", bgColor: "bg-muted" },
  site_created: { icon: Globe, color: "text-primary", bgColor: "bg-primary/20" },
  site_updated: { icon: Globe, color: "text-info", bgColor: "bg-info/20" },
  site_deleted: { icon: Globe, color: "text-destructive", bgColor: "bg-destructive/20" },
  database_created: { icon: Database, color: "text-primary", bgColor: "bg-primary/20" },
  database_deleted: { icon: Database, color: "text-destructive", bgColor: "bg-destructive/20" },
  backup_created: { icon: HardDrive, color: "text-success", bgColor: "bg-success/20" },
  backup_restored: { icon: HardDrive, color: "text-info", bgColor: "bg-info/20" },
  backup_deleted: { icon: HardDrive, color: "text-destructive", bgColor: "bg-destructive/20" },
  file_uploaded: { icon: FileText, color: "text-success", bgColor: "bg-success/20" },
  file_deleted: { icon: FileText, color: "text-destructive", bgColor: "bg-destructive/20" },
  file_modified: { icon: FileText, color: "text-info", bgColor: "bg-info/20" },
  user_invited: { icon: Users, color: "text-primary", bgColor: "bg-primary/20" },
  user_removed: { icon: Users, color: "text-destructive", bgColor: "bg-destructive/20" },
  role_changed: { icon: Shield, color: "text-warning", bgColor: "bg-warning/20" },
  settings_updated: { icon: Settings, color: "text-info", bgColor: "bg-info/20" },
  password_changed: { icon: Key, color: "text-warning", bgColor: "bg-warning/20" },
  security_alert: { icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/20" },
};

const activityCategories = [
  { value: "all", label: "All Activities" },
  { value: "auth", label: "Authentication", types: ["login", "logout"] },
  { value: "sites", label: "Sites", types: ["site_created", "site_updated", "site_deleted"] },
  { value: "databases", label: "Databases", types: ["database_created", "database_deleted"] },
  { value: "backups", label: "Backups", types: ["backup_created", "backup_restored", "backup_deleted"] },
  { value: "files", label: "Files", types: ["file_uploaded", "file_deleted", "file_modified"] },
  { value: "users", label: "Users", types: ["user_invited", "user_removed", "role_changed"] },
  { value: "security", label: "Security", types: ["password_changed", "settings_updated", "security_alert"] },
];

export const ActivityLogsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSite, setSelectedSite] = useState("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const { data: sites } = useSites();
  const { data: logs, isLoading, refetch } = useActivityLogs({
    limit: 100,
    siteId: selectedSite !== "all" ? selectedSite : undefined,
  });

  // Filter logs based on search and category
  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      activityCategories
        .find((c) => c.value === selectedCategory)
        ?.types?.includes(log.activity_type);

    return matchesSearch && matchesCategory;
  });

  // Group logs by date
  const groupedLogs = filteredLogs?.reduce((groups, log) => {
    const date = new Date(log.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, typeof filteredLogs>);

  // Stats
  const todayCount = logs?.filter(
    (log) => new Date(log.created_at).toDateString() === new Date().toDateString()
  ).length || 0;

  const securityAlerts = logs?.filter(
    (log) => log.activity_type === "security_alert"
  ).length || 0;

  const getSiteName = (siteId: string | null) => {
    if (!siteId) return null;
    const site = sites?.find((s) => s.id === siteId);
    return site?.domain;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Activity Logs</h2>
          <p className="text-muted-foreground">
            Track all actions and changes across your panel
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{logs?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <Clock className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{todayCount}</p>
                <p className="text-xs text-muted-foreground">Today's Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{securityAlerts}</p>
                <p className="text-xs text-muted-foreground">Security Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {activityCategories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
            <Globe className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites?.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Timeline */}
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            {filteredLogs?.length || 0} activities found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-muted-foreground">Loading activities...</span>
              </div>
            </div>
          ) : !filteredLogs?.length ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No activities found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activities will appear here as you use the panel
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedLogs || {}).map(([date, dateLogs]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-medium text-muted-foreground px-2">
                      {date}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="space-y-2">
                    {dateLogs?.map((log) => {
                      const config = activityConfig[log.activity_type];
                      const Icon = config.icon;
                      const siteName = getSiteName(log.site_id);
                      const isExpanded = expandedLog === log.id;

                      return (
                        <Collapsible
                          key={log.id}
                          open={isExpanded}
                          onOpenChange={() =>
                            setExpandedLog(isExpanded ? null : log.id)
                          }
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                              <div
                                className={`p-2 rounded-lg ${config.bgColor} mt-0.5`}
                              >
                                <Icon className={`w-4 h-4 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-foreground">
                                    {log.title}
                                  </p>
                                  {siteName && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-muted"
                                    >
                                      {siteName}
                                    </Badge>
                                  )}
                                </div>
                                {log.description && (
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {log.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(log.created_at), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 text-muted-foreground transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-12 p-3 rounded-lg bg-muted/30 border border-border">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Activity Type</p>
                                  <p className="font-mono text-foreground">
                                    {log.activity_type}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Timestamp</p>
                                  <p className="font-mono text-foreground">
                                    {new Date(log.created_at).toLocaleString()}
                                  </p>
                                </div>
                                {log.user_agent && (
                                  <div className="col-span-full">
                                    <p className="text-muted-foreground">User Agent</p>
                                    <p className="font-mono text-foreground text-xs break-all">
                                      {log.user_agent}
                                    </p>
                                  </div>
                                )}
                                {Object.keys(log.metadata || {}).length > 0 && (
                                  <div className="col-span-full">
                                    <p className="text-muted-foreground">Metadata</p>
                                    <pre className="font-mono text-foreground text-xs bg-muted/50 p-2 rounded mt-1 overflow-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
