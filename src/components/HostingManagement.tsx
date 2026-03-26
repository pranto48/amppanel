import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpDown, Bell, Crown, PauseCircle, PlayCircle, Plus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useProfiles } from "@/hooks/useUsers";
import { useSites } from "@/hooks/useSites";
import {
  useAssignHostingPackage,
  useHostingPackages,
  useResellerAccounts,
  useResolveOveruseAlert,
  useResourceOveruseAlerts,
  useRunResourceUsageAudit,
  useSaveHostingPackage,
  useSaveResellerAccount,
  useSiteHostingAssignments,
  useSuspendHostedSite,
  useUnsuspendHostedSite,
} from "@/hooks/useHostingPackages";

const emptyPackageForm = {
  name: "",
  description: "",
  billing_cycle: "monthly",
  price_usd: 0,
  storage_limit_mb: 10240,
  bandwidth_limit_gb: 100,
  max_domains: 1,
  max_subdomains: 10,
  max_databases: 5,
  max_mailboxes: 10,
  max_cron_jobs: 5,
  supports_nodejs: true,
  php_versions: "8.2",
};

export function HostingManagement() {
  const { toast } = useToast();
  const { data: packages = [] } = useHostingPackages();
  const { data: resellers = [] } = useResellerAccounts();
  const { data: assignments = [] } = useSiteHostingAssignments();
  const { data: alerts = [] } = useResourceOveruseAlerts();
  const { data: sites = [] } = useSites();
  const { data: users = [] } = useProfiles();

  const savePackage = useSaveHostingPackage();
  const saveReseller = useSaveResellerAccount();
  const assignPackage = useAssignHostingPackage();
  const suspendSite = useSuspendHostedSite();
  const unsuspendSite = useUnsuspendHostedSite();
  const runAudit = useRunResourceUsageAudit();
  const resolveAlert = useResolveOveruseAlert();

  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [resellerDialogOpen, setResellerDialogOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedResellerId, setSelectedResellerId] = useState("none");
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [resellerForm, setResellerForm] = useState({ profile_id: "", company_name: "", contact_email: "", max_client_accounts: 25, max_sites: 100, commission_rate: 0, is_active: true });

  const assignableSites = sites.filter((site) => site.status !== "error");
  const availableUsers = users.filter((user) => user.email);
  const openAlerts = alerts.filter((alert) => alert.status === "open");

  const unassignedSites = useMemo(() => assignableSites.filter((site) => !assignments.some((assignment) => assignment.site_id === site.id)), [assignableSites, assignments]);

  const handleSavePackage = async () => {
    try {
      await savePackage.mutateAsync({
        payload: {
          ...packageForm,
          php_versions: packageForm.php_versions.split(",").map((value) => value.trim()).filter(Boolean),
          features: { backups: true, ssl: true, firewall: true },
        },
      });
      toast({ title: "Hosting package saved" });
      setPackageDialogOpen(false);
      setPackageForm(emptyPackageForm);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Unable to save package", description: error.message });
    }
  };

  const handleSaveReseller = async () => {
    try {
      await saveReseller.mutateAsync({ payload: resellerForm });
      toast({ title: "Reseller saved" });
      setResellerDialogOpen(false);
      setResellerForm({ profile_id: "", company_name: "", contact_email: "", max_client_accounts: 25, max_sites: 100, commission_rate: 0, is_active: true });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Unable to save reseller", description: error.message });
    }
  };

  const handleAssignPackage = async () => {
    if (!selectedSiteId || !selectedPackageId) return;
    try {
      await assignPackage.mutateAsync({ site_id: selectedSiteId, package_id: selectedPackageId, reseller_account_id: selectedResellerId === "none" ? null : selectedResellerId });
      toast({ title: "Package assigned", description: "Upgrade / downgrade flow completed for the selected site." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Assignment failed", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hosting Packages & Resellers</h2>
          <p className="text-muted-foreground">Create plans, assign upgrades/downgrades, manage reseller accounts, suspend hosting accounts, and track resource overuse alerts.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => runAudit.mutate({})}><Bell className="w-4 h-4 mr-2" />Run usage audit</Button>
          <Button variant="outline" onClick={() => setResellerDialogOpen(true)}><Crown className="w-4 h-4 mr-2" />Add reseller</Button>
          <Button onClick={() => setPackageDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add package</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{packages.length}</p><p className="text-sm text-muted-foreground">Packages</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{resellers.length}</p><p className="text-sm text-muted-foreground">Resellers</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{openAlerts.length}</p><p className="text-sm text-muted-foreground">Open overuse alerts</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{unassignedSites.length}</p><p className="text-sm text-muted-foreground">Sites without package</p></div>
      </div>

      <div className="glass-card rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2"><ArrowUpDown className="w-4 h-4 text-primary" /><h3 className="font-semibold">Package assignment / upgrade / downgrade</h3></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Site</Label><Select value={selectedSiteId} onValueChange={setSelectedSiteId}><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select site" /></SelectTrigger><SelectContent>{assignableSites.map((site) => <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Package</Label><Select value={selectedPackageId} onValueChange={setSelectedPackageId}><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select package" /></SelectTrigger><SelectContent>{packages.map((pkg) => <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Reseller</Label><Select value={selectedResellerId} onValueChange={setSelectedResellerId}><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Direct account</SelectItem>{resellers.map((reseller) => <SelectItem key={reseller.id} value={reseller.id}>{reseller.company_name}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex items-end"><Button onClick={handleAssignPackage} className="w-full" disabled={!selectedSiteId || !selectedPackageId}>Assign package</Button></div>
        </div>
      </div>

      <Tabs defaultValue="packages" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="accounts">Hosted Accounts</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="packages">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between"><h3 className="font-semibold">{pkg.name}</h3><Badge variant="outline">${pkg.price_usd}/{pkg.billing_cycle}</Badge></div>
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Storage: {pkg.storage_limit_mb} MB</div>
                  <div>Bandwidth: {pkg.bandwidth_limit_gb} GB</div>
                  <div>Domains: {pkg.max_domains}</div>
                  <div>Subdomains: {pkg.max_subdomains}</div>
                  <div>Databases: {pkg.max_databases}</div>
                  <div>Mailboxes: {pkg.max_mailboxes}</div>
                  <div>Cron jobs: {pkg.max_cron_jobs}</div>
                  <div>Node.js: {pkg.supports_nodejs ? "Yes" : "No"}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accounts">
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Domain</TableHead><TableHead>Package</TableHead><TableHead>Reseller</TableHead><TableHead>Usage</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {assignments.map((assignment) => {
                  const site = assignment.sites;
                  const overStorage = site ? site.storage_used_mb >= site.storage_limit_mb : false;
                  const overBandwidth = site ? Number(site.bandwidth_used_gb) >= site.bandwidth_limit_gb : false;
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell><div className="font-medium">{site?.domain ?? "Unknown"}</div>{(overStorage || overBandwidth) ? <div className="text-xs text-warning">Overuse risk detected</div> : null}</TableCell>
                      <TableCell>{assignment.hosting_packages?.name}</TableCell>
                      <TableCell>{assignment.reseller_accounts?.company_name ?? "Direct"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{site ? `${site.storage_used_mb}/${site.storage_limit_mb} MB • ${site.bandwidth_used_gb}/${site.bandwidth_limit_gb} GB` : "—"}</TableCell>
                      <TableCell><Badge variant="outline">{assignment.assignment_status}</Badge></TableCell>
                      <TableCell className="text-right"><div className="flex justify-end gap-2">{site?.status === "suspended" ? <Button size="sm" variant="outline" onClick={() => unsuspendSite.mutate({ site_id: site.id })}><PlayCircle className="w-4 h-4 mr-2" />Unsuspend</Button> : <Button size="sm" variant="outline" onClick={() => suspendSite.mutate({ site_id: site?.id })}><PauseCircle className="w-4 h-4 mr-2" />Suspend</Button>}</div></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-3">
            {alerts.length === 0 ? <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">No overuse alerts yet.</div> : alerts.map((alert) => (
              <div key={alert.id} className="glass-card rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-warning" /><span className="font-medium">{alert.sites?.domain}</span><Badge variant="outline">{alert.alert_type}</Badge><Badge variant="outline">{alert.status}</Badge></div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">Current {alert.current_value} / limit {alert.limit_value}</p>
                </div>
                <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => resolveAlert.mutate({ alert_id: alert.id })} disabled={alert.status === "resolved"}><AlertTriangle className="w-4 h-4 mr-2" />Resolve</Button></div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader><DialogTitle>Create hosting package</DialogTitle><DialogDescription>Define package quotas for domains, subdomains, databases, mailboxes, and cron jobs.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={packageForm.name} onChange={(e) => setPackageForm((v) => ({ ...v, name: e.target.value }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Billing cycle</Label><Select value={packageForm.billing_cycle} onValueChange={(value) => setPackageForm((v) => ({ ...v, billing_cycle: value }))}><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select></div>
            <div className="space-y-2 md:col-span-2"><Label>Description</Label><Input value={packageForm.description} onChange={(e) => setPackageForm((v) => ({ ...v, description: e.target.value }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Price USD</Label><Input type="number" value={packageForm.price_usd} onChange={(e) => setPackageForm((v) => ({ ...v, price_usd: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Storage MB</Label><Input type="number" value={packageForm.storage_limit_mb} onChange={(e) => setPackageForm((v) => ({ ...v, storage_limit_mb: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Bandwidth GB</Label><Input type="number" value={packageForm.bandwidth_limit_gb} onChange={(e) => setPackageForm((v) => ({ ...v, bandwidth_limit_gb: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Domains</Label><Input type="number" value={packageForm.max_domains} onChange={(e) => setPackageForm((v) => ({ ...v, max_domains: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Subdomains</Label><Input type="number" value={packageForm.max_subdomains} onChange={(e) => setPackageForm((v) => ({ ...v, max_subdomains: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Databases</Label><Input type="number" value={packageForm.max_databases} onChange={(e) => setPackageForm((v) => ({ ...v, max_databases: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Mailboxes</Label><Input type="number" value={packageForm.max_mailboxes} onChange={(e) => setPackageForm((v) => ({ ...v, max_mailboxes: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Cron jobs</Label><Input type="number" value={packageForm.max_cron_jobs} onChange={(e) => setPackageForm((v) => ({ ...v, max_cron_jobs: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>PHP versions</Label><Input value={packageForm.php_versions} onChange={(e) => setPackageForm((v) => ({ ...v, php_versions: e.target.value }))} className="bg-secondary border-border" placeholder="8.1, 8.2, 8.3" /></div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 md:col-span-2"><div><Label>Supports Node.js</Label><p className="text-xs text-muted-foreground">Allow Node.js application deployments on this package.</p></div><Switch checked={packageForm.supports_nodejs} onCheckedChange={(checked) => setPackageForm((v) => ({ ...v, supports_nodejs: checked }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPackageDialogOpen(false)}>Cancel</Button><Button onClick={handleSavePackage}>Save package</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resellerDialogOpen} onOpenChange={setResellerDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Create reseller account</DialogTitle><DialogDescription>Link a platform user to a reseller profile with client and site limits.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2"><Label>User</Label><Select value={resellerForm.profile_id} onValueChange={(value) => { const user = availableUsers.find((item) => item.id === value); setResellerForm((v) => ({ ...v, profile_id: value, contact_email: user?.email ?? v.contact_email })); }}><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent>{availableUsers.map((user) => <SelectItem key={user.id} value={user.id}>{user.full_name || user.email || user.id}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Company</Label><Input value={resellerForm.company_name} onChange={(e) => setResellerForm((v) => ({ ...v, company_name: e.target.value }))} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Contact email</Label><Input value={resellerForm.contact_email} onChange={(e) => setResellerForm((v) => ({ ...v, contact_email: e.target.value }))} className="bg-secondary border-border" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Max clients</Label><Input type="number" value={resellerForm.max_client_accounts} onChange={(e) => setResellerForm((v) => ({ ...v, max_client_accounts: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Max sites</Label><Input type="number" value={resellerForm.max_sites} onChange={(e) => setResellerForm((v) => ({ ...v, max_sites: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Commission %</Label><Input type="number" value={resellerForm.commission_rate} onChange={(e) => setResellerForm((v) => ({ ...v, commission_rate: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setResellerDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveReseller}>Save reseller</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
