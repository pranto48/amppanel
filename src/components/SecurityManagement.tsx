import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  Globe,
  Server,
  Clock,
  Ban,
  Eye,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Mock data for firewall rules
const initialFirewallRules = [
  { id: "1", port: "22", protocol: "tcp", action: "allow", source: "any", description: "SSH" },
  { id: "2", port: "80", protocol: "tcp", action: "allow", source: "any", description: "HTTP" },
  { id: "3", port: "443", protocol: "tcp", action: "allow", source: "any", description: "HTTPS" },
  { id: "4", port: "3306", protocol: "tcp", action: "allow", source: "10.0.0.0/8", description: "MySQL (internal)" },
  { id: "5", port: "5432", protocol: "tcp", action: "allow", source: "10.0.0.0/8", description: "PostgreSQL (internal)" },
  { id: "6", port: "6379", protocol: "tcp", action: "deny", source: "any", description: "Redis (blocked)" },
];

// Mock data for fail2ban jails
const fail2banJails = [
  { name: "sshd", enabled: true, currentlyBanned: 3, totalBanned: 156, filter: "sshd", maxRetry: 5, banTime: 3600 },
  { name: "nginx-http-auth", enabled: true, currentlyBanned: 1, totalBanned: 42, filter: "nginx-http-auth", maxRetry: 3, banTime: 7200 },
  { name: "nginx-limit-req", enabled: true, currentlyBanned: 0, totalBanned: 89, filter: "nginx-limit-req", maxRetry: 10, banTime: 1800 },
  { name: "postfix-sasl", enabled: false, currentlyBanned: 0, totalBanned: 23, filter: "postfix-sasl", maxRetry: 3, banTime: 3600 },
  { name: "dovecot", enabled: true, currentlyBanned: 2, totalBanned: 67, filter: "dovecot", maxRetry: 5, banTime: 3600 },
];

// Mock banned IPs
const bannedIPs = [
  { ip: "185.234.219.45", jail: "sshd", banTime: "2026-02-02 14:25:00", country: "RU", attempts: 12 },
  { ip: "45.142.120.92", jail: "sshd", banTime: "2026-02-02 14:18:00", country: "CN", attempts: 8 },
  { ip: "103.145.12.78", jail: "sshd", banTime: "2026-02-02 14:10:00", country: "IN", attempts: 15 },
  { ip: "91.240.118.201", jail: "nginx-http-auth", banTime: "2026-02-02 13:45:00", country: "UA", attempts: 6 },
  { ip: "194.26.29.113", jail: "dovecot", banTime: "2026-02-02 13:30:00", country: "DE", attempts: 9 },
  { ip: "23.94.24.125", jail: "dovecot", banTime: "2026-02-02 12:55:00", country: "US", attempts: 7 },
];

// Mock security logs
const securityLogs = [
  { time: "14:31:05", level: "warning", message: "Failed SSH login attempt from 185.234.219.45 (12 attempts)", source: "sshd" },
  { time: "14:30:58", level: "info", message: "IP 185.234.219.45 banned by fail2ban [sshd]", source: "fail2ban" },
  { time: "14:28:12", level: "warning", message: "Brute force attack detected on port 22", source: "sshd" },
  { time: "14:25:33", level: "info", message: "Firewall rule updated: Allow 443/tcp", source: "ufw" },
  { time: "14:22:01", level: "error", message: "Invalid certificate presented by client 91.240.118.201", source: "nginx" },
  { time: "14:18:45", level: "warning", message: "Rate limit exceeded for IP 45.142.120.92", source: "nginx" },
  { time: "14:15:22", level: "info", message: "IP 45.142.120.92 banned by fail2ban [sshd]", source: "fail2ban" },
  { time: "14:12:08", level: "info", message: "SSL certificate renewed for *.example.com", source: "certbot" },
  { time: "14:10:33", level: "warning", message: "Suspicious activity detected: Port scan from 103.145.12.78", source: "portsentry" },
  { time: "14:05:19", level: "info", message: "Fail2ban service restarted", source: "systemd" },
  { time: "14:00:00", level: "info", message: "Daily security scan completed - 0 vulnerabilities found", source: "clamav" },
  { time: "13:55:42", level: "error", message: "ModSecurity: Access denied with code 403 - SQL injection attempt", source: "modsec" },
  { time: "13:50:15", level: "warning", message: "Failed login attempt for user 'admin' from 194.26.29.113", source: "dovecot" },
  { time: "13:45:00", level: "info", message: "IP 91.240.118.201 banned by fail2ban [nginx-http-auth]", source: "fail2ban" },
  { time: "13:40:28", level: "info", message: "Firewall status: active, 6 rules loaded", source: "ufw" },
];

export const SecurityManagement = () => {
  const [firewallRules, setFirewallRules] = useState(initialFirewallRules);
  const [firewallEnabled, setFirewallEnabled] = useState(true);
  const [addRuleOpen, setAddRuleOpen] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // New rule form state
  const [newRule, setNewRule] = useState({
    port: "",
    protocol: "tcp",
    action: "allow",
    source: "any",
    description: "",
  });

  const handleAddRule = () => {
    if (!newRule.port || !newRule.description) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Port and description are required.",
      });
      return;
    }

    const rule = {
      id: Date.now().toString(),
      ...newRule,
    };

    setFirewallRules([...firewallRules, rule]);
    setNewRule({ port: "", protocol: "tcp", action: "allow", source: "any", description: "" });
    setAddRuleOpen(false);

    toast({
      title: "Rule Added",
      description: `Firewall rule for port ${newRule.port} has been added.`,
    });
  };

  const handleDeleteRule = (id: string) => {
    setFirewallRules(firewallRules.filter((rule) => rule.id !== id));
    toast({
      title: "Rule Deleted",
      description: "Firewall rule has been removed.",
    });
  };

  const handleUnbanIP = (ip: string) => {
    toast({
      title: "IP Unbanned",
      description: `IP address ${ip} has been unbanned.`,
    });
  };

  const filteredLogs = securityLogs.filter((log) => {
    if (logFilter !== "all" && log.level !== logFilter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-destructive";
      case "warning":
        return "text-warning";
      case "info":
        return "text-info";
      default:
        return "text-muted-foreground";
    }
  };

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "warning":
        return "bg-warning/20 text-warning border-warning/30";
      case "info":
        return "bg-info/20 text-info border-info/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Security</h2>
          <p className="text-muted-foreground">
            Manage firewall rules, fail2ban, and view security logs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={firewallEnabled}
              onCheckedChange={setFirewallEnabled}
              id="firewall-toggle"
            />
            <Label htmlFor="firewall-toggle" className="text-sm">
              Firewall {firewallEnabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
          <Badge
            variant="outline"
            className={firewallEnabled ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"}
          >
            {firewallEnabled ? <ShieldCheck className="w-3 h-3 mr-1" /> : <ShieldX className="w-3 h-3 mr-1" />}
            {firewallEnabled ? "Protected" : "Unprotected"}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{firewallRules.length}</p>
              <p className="text-sm text-muted-foreground">Firewall Rules</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {fail2banJails.filter((j) => j.enabled).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Jails</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Ban className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{bannedIPs.length}</p>
              <p className="text-sm text-muted-foreground">Banned IPs</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {securityLogs.filter((l) => l.level === "error" || l.level === "warning").length}
              </p>
              <p className="text-sm text-muted-foreground">Alerts Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="firewall" className="space-y-4">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="firewall" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="w-4 h-4 mr-2" />
            Firewall
          </TabsTrigger>
          <TabsTrigger value="fail2ban" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Ban className="w-4 h-4 mr-2" />
            Fail2Ban
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Eye className="w-4 h-4 mr-2" />
            Security Logs
          </TabsTrigger>
        </TabsList>

        {/* Firewall Tab */}
        <TabsContent value="firewall" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              UFW (Uncomplicated Firewall) rules for incoming connections
            </p>
            <Button onClick={() => setAddRuleOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Port</TableHead>
                  <TableHead className="text-muted-foreground">Protocol</TableHead>
                  <TableHead className="text-muted-foreground">Action</TableHead>
                  <TableHead className="text-muted-foreground">Source</TableHead>
                  <TableHead className="text-muted-foreground">Description</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {firewallRules.map((rule) => (
                  <TableRow key={rule.id} className="border-border">
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{rule.port}</code>
                    </TableCell>
                    <TableCell className="uppercase text-muted-foreground">{rule.protocol}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          rule.action === "allow"
                            ? "bg-success/20 text-success border-success/30"
                            : "bg-destructive/20 text-destructive border-destructive/30"
                        }
                      >
                        {rule.action === "allow" ? (
                          <Unlock className="w-3 h-3 mr-1" />
                        ) : (
                          <Lock className="w-3 h-3 mr-1" />
                        )}
                        {rule.action.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{rule.source}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{rule.description}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Fail2Ban Tab */}
        <TabsContent value="fail2ban" className="space-y-6">
          {/* Jails Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">Jails</h3>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fail2banJails.map((jail) => (
                <div
                  key={jail.name}
                  className={`glass-card rounded-xl p-4 border-l-4 ${
                    jail.enabled ? "border-l-success" : "border-l-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{jail.name}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        jail.enabled
                          ? "bg-success/20 text-success border-success/30"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {jail.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currently Banned:</span>
                      <span className={jail.currentlyBanned > 0 ? "text-warning font-medium" : "text-foreground"}>
                        {jail.currentlyBanned}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Banned:</span>
                      <span className="text-foreground">{jail.totalBanned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Retry:</span>
                      <span className="text-foreground">{jail.maxRetry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ban Time:</span>
                      <span className="text-foreground">{jail.banTime / 60} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banned IPs Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Currently Banned IPs</h3>

            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">IP Address</TableHead>
                    <TableHead className="text-muted-foreground">Country</TableHead>
                    <TableHead className="text-muted-foreground">Jail</TableHead>
                    <TableHead className="text-muted-foreground">Attempts</TableHead>
                    <TableHead className="text-muted-foreground">Ban Time</TableHead>
                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bannedIPs.map((ban) => (
                    <TableRow key={ban.ip} className="border-border">
                      <TableCell>
                        <code className="bg-destructive/10 text-destructive px-2 py-1 rounded text-sm">
                          {ban.ip}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muted">
                          {ban.country}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ban.jail}</TableCell>
                      <TableCell>
                        <span className="text-warning font-medium">{ban.attempts}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {ban.banTime}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanIP(ban.ip)}
                        >
                          <Unlock className="w-3 h-3 mr-1" />
                          Unban
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Security Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <Select value={logFilter} onValueChange={setLogFilter}>
              <SelectTrigger className="w-[150px] bg-secondary border-border">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-2 font-mono text-sm">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-muted-foreground shrink-0">{log.time}</span>
                    <Badge variant="outline" className={`shrink-0 ${getLogLevelBadge(log.level)}`}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-info shrink-0">[{log.source}]</span>
                    <span className={getLogLevelColor(log.level)}>{log.message}</span>
                  </div>
                ))}
                {filteredLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No logs matching your criteria
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Rule Dialog */}
      <Dialog open={addRuleOpen} onOpenChange={setAddRuleOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add Firewall Rule</DialogTitle>
            <DialogDescription>
              Create a new UFW firewall rule for incoming connections
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  placeholder="e.g., 8080"
                  value={newRule.port}
                  onChange={(e) => setNewRule({ ...newRule, port: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Protocol</Label>
                <Select
                  value={newRule.protocol}
                  onValueChange={(value) => setNewRule({ ...newRule, protocol: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="both">TCP/UDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Action</Label>
                <Select
                  value={newRule.action}
                  onValueChange={(value) => setNewRule({ ...newRule, action: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="deny">Deny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Input
                  placeholder="any or IP/CIDR"
                  value={newRule.source}
                  onChange={(e) => setNewRule({ ...newRule, source: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g., Custom application port"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRuleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRule}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
