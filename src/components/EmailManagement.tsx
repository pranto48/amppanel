import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Edit,
  ExternalLink,
  Forward,
  HardDrive,
  Loader2,
  Mail,
  MailPlus,
  MessageSquareReply,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSites } from "@/hooks/useSites";
import {
  EmailAccount,
  EmailAutoresponder,
  EmailForwarder,
  useCreateEmailAccount,
  useCreateEmailAutoresponder,
  useCreateEmailForwarder,
  useDeleteEmailAccount,
  useDeleteEmailAutoresponder,
  useDeleteEmailForwarder,
  useEmailAccounts,
  useEmailAutoresponders,
  useEmailForwarders,
  useUpdateEmailAccount,
  useUpdateEmailAutoresponder,
  useUpdateEmailForwarder,
} from "@/hooks/useEmailAccounts";
import {
  useGenerateDkim,
  useMailBounceDiagnostics,
  useMailDeliverabilityChecks,
  useMailDkimRotations,
  useMailDomainSettings,
  useMailQueue,
  useMailQuarantine,
  useMailSmtpLogs,
  useMailboxUsageSnapshots,
  usePurgeMailQueueMessage,
  useReleaseQuarantineMessage,
  useRetryMailQueueMessage,
  useRotateDkim,
  useRunMailDeliverabilityCheck,
  useSaveMailSettings,
} from "@/hooks/useMailOperations";
import { useToast } from "@/hooks/use-toast";

function statusBadge(active: boolean) {
  return (
    <Badge variant="outline" className={active ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground"}>
      {active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function deliverabilityBadge(status: string) {
  if (status === "healthy") return <Badge variant="outline" className="bg-success/20 text-success border-success/30">healthy</Badge>;
  if (status === "warning") return <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">warning</Badge>;
  return <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">critical</Badge>;
}

export const EmailManagement = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const selectedSiteId = selectedSite === "all" ? undefined : selectedSite;

  const { data: sites = [] } = useSites();
  const { data: accounts = [], isLoading: accountsLoading } = useEmailAccounts(selectedSiteId);
  const { data: forwarders = [], isLoading: forwardersLoading } = useEmailForwarders(selectedSiteId);
  const { data: autoresponders = [] } = useEmailAutoresponders();
  const { data: settings } = useMailDomainSettings(selectedSiteId);
  const { data: queue = [] } = useMailQueue(selectedSiteId);
  const { data: quarantine = [] } = useMailQuarantine(selectedSiteId);
  const { data: smtpLogs = [] } = useMailSmtpLogs(selectedSiteId);
  const { data: deliverabilityChecks = [] } = useMailDeliverabilityChecks(selectedSiteId);
  const { data: dkimRotations = [] } = useMailDkimRotations(selectedSiteId);
  const { data: bounceDiagnostics = [] } = useMailBounceDiagnostics(selectedSiteId);
  const { data: usageSnapshots = [] } = useMailboxUsageSnapshots(accounts.map((account) => account.id));

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ email: "", password: "", quota_mb: 1000, site_id: "" });

  const [forwarderDialogOpen, setForwarderDialogOpen] = useState(false);
  const [editingForwarder, setEditingForwarder] = useState<EmailForwarder | null>(null);
  const [forwarderForm, setForwarderForm] = useState({ source_email: "", destination_emails: "", site_id: "" });

  const [autoresponderDialogOpen, setAutoresponderDialogOpen] = useState(false);
  const [editingAutoresponder, setEditingAutoresponder] = useState<EmailAutoresponder | null>(null);
  const [autoresponderForm, setAutoresponderForm] = useState({ email_account_id: "", subject: "", body: "", start_date: "", end_date: "" });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);
  const [mailSettingsForm, setMailSettingsForm] = useState({
    spf_policy: settings?.spf_policy ?? "v=spf1 mx a ~all",
    dmarc_policy: settings?.dmarc_policy ?? "v=DMARC1; p=quarantine; rua=mailto:postmaster@example.com",
    spam_filter_provider: settings?.spam_filter_provider ?? "rspamd",
    spam_filter_enabled: settings?.spam_filter_enabled ?? true,
    spam_threshold: settings?.spam_threshold ?? 6.5,
    quarantine_enabled: settings?.quarantine_enabled ?? true,
    smtp_relay_enabled: settings?.smtp_relay_enabled ?? false,
    smtp_relay_host: settings?.smtp_relay_host ?? "",
    smtp_relay_port: settings?.smtp_relay_port ?? 587,
    smtp_relay_username: settings?.smtp_relay_username ?? "",
    smtp_relay_password_hint: settings?.smtp_relay_password_hint ?? "",
    webmail_provider: settings?.webmail_provider ?? "roundcube",
    webmail_url: settings?.webmail_url ?? "",
  });


  useEffect(() => {
    setMailSettingsForm({
      spf_policy: settings?.spf_policy ?? "v=spf1 mx a ~all",
      dmarc_policy: settings?.dmarc_policy ?? "v=DMARC1; p=quarantine; rua=mailto:postmaster@example.com",
      spam_filter_provider: settings?.spam_filter_provider ?? "rspamd",
      spam_filter_enabled: settings?.spam_filter_enabled ?? true,
      spam_threshold: settings?.spam_threshold ?? 6.5,
      quarantine_enabled: settings?.quarantine_enabled ?? true,
      smtp_relay_enabled: settings?.smtp_relay_enabled ?? false,
      smtp_relay_host: settings?.smtp_relay_host ?? "",
      smtp_relay_port: settings?.smtp_relay_port ?? 587,
      smtp_relay_username: settings?.smtp_relay_username ?? "",
      smtp_relay_password_hint: settings?.smtp_relay_password_hint ?? "",
      webmail_provider: settings?.webmail_provider ?? "roundcube",
      webmail_url: settings?.webmail_url ?? "",
    });
  }, [settings]);

  const createAccount = useCreateEmailAccount();
  const updateAccount = useUpdateEmailAccount();
  const deleteAccount = useDeleteEmailAccount();
  const createForwarder = useCreateEmailForwarder();
  const updateForwarder = useUpdateEmailForwarder();
  const deleteForwarder = useDeleteEmailForwarder();
  const createAutoresponder = useCreateEmailAutoresponder();
  const updateAutoresponder = useUpdateEmailAutoresponder();
  const deleteAutoresponder = useDeleteEmailAutoresponder();
  const saveMailSettings = useSaveMailSettings();
  const generateDkim = useGenerateDkim();
  const rotateDkim = useRotateDkim();
  const runDeliverabilityCheck = useRunMailDeliverabilityCheck();
  const retryQueueMessage = useRetryMailQueueMessage();
  const purgeQueueMessage = usePurgeMailQueueMessage();
  const releaseQuarantineMessage = useReleaseQuarantineMessage();

  const filteredAccounts = accounts.filter((a) => a.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredForwarders = forwarders.filter((f) => f.source_email.toLowerCase().includes(searchQuery.toLowerCase()) || f.destination_emails.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredSmtpLogs = smtpLogs.filter((log) => [log.sender, log.recipient, log.response ?? "", log.status].join(" ").toLowerCase().includes(searchQuery.toLowerCase()));

  const latestDeliverability = deliverabilityChecks[0] ?? null;
  const activeQuarantine = quarantine.filter((item) => !item.released_at).length;
  const deferredQueue = queue.filter((item) => item.status === "deferred" || item.status === "queued").length;

  const usageByAccount = useMemo(() => usageSnapshots.reduce<Record<string, typeof usageSnapshots>>((acc, snapshot) => {
    acc[snapshot.email_account_id] ??= [];
    acc[snapshot.email_account_id].push(snapshot);
    return acc;
  }, {}), [usageSnapshots]);
  const getSiteDomain = (siteId: string) => sites.find((site) => site.id === siteId)?.domain || "Unknown";

  const syncMailFormFromSettings = () => {
    setMailSettingsForm({
      spf_policy: settings?.spf_policy ?? "v=spf1 mx a ~all",
      dmarc_policy: settings?.dmarc_policy ?? "v=DMARC1; p=quarantine; rua=mailto:postmaster@example.com",
      spam_filter_provider: settings?.spam_filter_provider ?? "rspamd",
      spam_filter_enabled: settings?.spam_filter_enabled ?? true,
      spam_threshold: settings?.spam_threshold ?? 6.5,
      quarantine_enabled: settings?.quarantine_enabled ?? true,
      smtp_relay_enabled: settings?.smtp_relay_enabled ?? false,
      smtp_relay_host: settings?.smtp_relay_host ?? "",
      smtp_relay_port: settings?.smtp_relay_port ?? 587,
      smtp_relay_username: settings?.smtp_relay_username ?? "",
      smtp_relay_password_hint: settings?.smtp_relay_password_hint ?? "",
      webmail_provider: settings?.webmail_provider ?? "roundcube",
      webmail_url: settings?.webmail_url ?? "",
    });
  };

  const handleOpenAccountDialog = (account?: EmailAccount) => {
    if (account) {
      setEditingAccount(account);
      setAccountForm({ email: account.email, password: "", quota_mb: account.quota_mb, site_id: account.site_id });
    } else {
      setEditingAccount(null);
      setAccountForm({ email: "", password: "", quota_mb: 1000, site_id: sites[0]?.id || "" });
    }
    setAccountDialogOpen(true);
  };

  const handleSaveAccount = async () => {
    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({ id: editingAccount.id, quota_mb: accountForm.quota_mb });
        toast({ title: "Email account updated" });
      } else {
        await createAccount.mutateAsync({ site_id: accountForm.site_id, email: accountForm.email, password_hash: accountForm.password, quota_mb: accountForm.quota_mb });
        toast({ title: "Email account created" });
      }
      setAccountDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleOpenForwarderDialog = (forwarder?: EmailForwarder) => {
    if (forwarder) {
      setEditingForwarder(forwarder);
      setForwarderForm({ source_email: forwarder.source_email, destination_emails: forwarder.destination_emails.join(", "), site_id: forwarder.site_id });
    } else {
      setEditingForwarder(null);
      setForwarderForm({ source_email: "", destination_emails: "", site_id: sites[0]?.id || "" });
    }
    setForwarderDialogOpen(true);
  };

  const handleSaveForwarder = async () => {
    try {
      const destinations = forwarderForm.destination_emails.split(",").map((email) => email.trim()).filter(Boolean);
      if (editingForwarder) {
        await updateForwarder.mutateAsync({ id: editingForwarder.id, destination_emails: destinations });
        toast({ title: "Forwarder updated" });
      } else {
        await createForwarder.mutateAsync({ site_id: forwarderForm.site_id, source_email: forwarderForm.source_email, destination_emails: destinations });
        toast({ title: "Forwarder created" });
      }
      setForwarderDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleOpenAutoresponderDialog = (autoresponder?: EmailAutoresponder) => {
    if (autoresponder) {
      setEditingAutoresponder(autoresponder);
      setAutoresponderForm({
        email_account_id: autoresponder.email_account_id,
        subject: autoresponder.subject,
        body: autoresponder.body,
        start_date: autoresponder.start_date?.split("T")[0] || "",
        end_date: autoresponder.end_date?.split("T")[0] || "",
      });
    } else {
      setEditingAutoresponder(null);
      setAutoresponderForm({ email_account_id: accounts[0]?.id || "", subject: "", body: "", start_date: "", end_date: "" });
    }
    setAutoresponderDialogOpen(true);
  };

  const handleSaveAutoresponder = async () => {
    try {
      if (editingAutoresponder) {
        await updateAutoresponder.mutateAsync({ id: editingAutoresponder.id, subject: autoresponderForm.subject, body: autoresponderForm.body, start_date: autoresponderForm.start_date || null, end_date: autoresponderForm.end_date || null });
        toast({ title: "Autoresponder updated" });
      } else {
        await createAutoresponder.mutateAsync({ email_account_id: autoresponderForm.email_account_id, subject: autoresponderForm.subject, body: autoresponderForm.body, start_date: autoresponderForm.start_date || undefined, end_date: autoresponderForm.end_date || undefined });
        toast({ title: "Autoresponder created" });
      }
      setAutoresponderDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleToggleActive = async (type: string, id: string, currentState: boolean) => {
    try {
      if (type === "account") await updateAccount.mutateAsync({ id, is_active: !currentState });
      if (type === "forwarder") await updateForwarder.mutateAsync({ id, is_active: !currentState });
      if (type === "autoresponder") await updateAutoresponder.mutateAsync({ id, is_active: !currentState });
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${!currentState ? "enabled" : "disabled"}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "account") await deleteAccount.mutateAsync(deleteTarget.id);
      if (deleteTarget.type === "forwarder") await deleteForwarder.mutateAsync(deleteTarget.id);
      if (deleteTarget.type === "autoresponder") await deleteAutoresponder.mutateAsync(deleteTarget.id);
      toast({ title: `${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} deleted` });
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleSaveMailSettings = async () => {
    if (!selectedSiteId) return;
    try {
      await saveMailSettings.mutateAsync({ site_id: selectedSiteId, payload: mailSettingsForm });
      toast({ title: "Mail settings saved", description: "SPF, DMARC, spam controls, relay settings, and webmail config were updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Unable to save mail settings", description: error.message });
    }
  };

  const handleGenerateDkim = async (rotate = false) => {
    if (!selectedSiteId) return;
    try {
      const data = rotate
        ? await rotateDkim.mutateAsync({ site_id: selectedSiteId, payload: { selector: `s${Date.now()}` } })
        : await generateDkim.mutateAsync({ site_id: selectedSiteId, payload: { selector: settings?.dkim_selector ?? "default" } });
      toast({ title: rotate ? "DKIM rotated" : "DKIM generated", description: data.publishing_help });
    } catch (error: any) {
      toast({ variant: "destructive", title: "DKIM operation failed", description: error.message });
    }
  };

  const handleDeliverabilityCheck = async () => {
    if (!selectedSiteId) return;
    try {
      await runDeliverabilityCheck.mutateAsync({ site_id: selectedSiteId });
      toast({ title: "Deliverability check complete", description: "SPF, DMARC, DKIM, and blacklist posture were evaluated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deliverability check failed", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email & Deliverability</h2>
          <p className="text-muted-foreground">Manage accounts, queue/quarantine, DKIM/SPF/DMARC, relay routing, spam controls, analytics, logs, and webmail integration.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{filteredAccounts.length}</p><p className="text-sm text-muted-foreground">Mailboxes</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{deferredQueue}</p><p className="text-sm text-muted-foreground">Queued / deferred</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{activeQuarantine}</p><p className="text-sm text-muted-foreground">Quarantined</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{latestDeliverability?.score ?? "—"}</p><p className="text-sm text-muted-foreground">Deliverability score</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search emails, queue IDs, SMTP responses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-[220px] bg-secondary border-border"><SelectValue placeholder="Filter by site" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/50 flex flex-wrap h-auto">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="forwarders">Forwarders</TabsTrigger>
          <TabsTrigger value="autoresponders">Autoresponders</TabsTrigger>
          <TabsTrigger value="operations">Mail ops</TabsTrigger>
          <TabsTrigger value="deliverability">Deliverability</TabsTrigger>
          <TabsTrigger value="logs">SMTP logs</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => handleOpenAccountDialog()}><Plus className="w-4 h-4 mr-2" />Add Email Account</Button></div>
          <div className="glass-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Site</TableHead><TableHead>Storage</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {accountsLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow> : filteredAccounts.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No email accounts found</TableCell></TableRow> : filteredAccounts.map((account) => {
                  const recentUsage = usageByAccount[account.id]?.[0];
                  return (
                    <TableRow key={account.id}>
                      <TableCell><div className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /><span className="font-medium">{account.email}</span></div></TableCell>
                      <TableCell>{getSiteDomain(account.site_id)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm"><HardDrive className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">{account.used_mb} / {account.quota_mb} MB</span></div>
                          <Progress value={(account.used_mb / account.quota_mb) * 100} className="h-1.5 w-24" />
                          {recentUsage ? <p className="text-xs text-muted-foreground">{recentUsage.message_count} msgs • {recentUsage.spam_count} spam</p> : null}
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(account.is_active)}</TableCell>
                      <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Switch checked={account.is_active} onCheckedChange={() => handleToggleActive("account", account.id, account.is_active)} /><Button variant="ghost" size="icon" onClick={() => handleOpenAccountDialog(account)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => { setDeleteTarget({ type: "account", id: account.id, name: account.email }); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-destructive" /></Button></div></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="forwarders" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => handleOpenForwarderDialog()}><Plus className="w-4 h-4 mr-2" />Add Forwarder</Button></div>
          <div className="glass-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Source</TableHead><TableHead>Destinations</TableHead><TableHead>Site</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {forwardersLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow> : filteredForwarders.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No forwarders found</TableCell></TableRow> : filteredForwarders.map((forwarder) => (
                  <TableRow key={forwarder.id}>
                    <TableCell><div className="flex items-center gap-2"><MailPlus className="w-4 h-4 text-info" /><span className="font-medium">{forwarder.source_email}</span></div></TableCell>
                    <TableCell><div className="flex items-center gap-2 flex-wrap"><ArrowRight className="w-4 h-4 text-muted-foreground" />{forwarder.destination_emails.map((dest, i) => <Badge key={i} variant="secondary" className="text-xs">{dest}</Badge>)}</div></TableCell>
                    <TableCell>{getSiteDomain(forwarder.site_id)}</TableCell>
                    <TableCell>{statusBadge(forwarder.is_active)}</TableCell>
                    <TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Switch checked={forwarder.is_active} onCheckedChange={() => handleToggleActive("forwarder", forwarder.id, forwarder.is_active)} /><Button variant="ghost" size="icon" onClick={() => handleOpenForwarderDialog(forwarder)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => { setDeleteTarget({ type: "forwarder", id: forwarder.id, name: forwarder.source_email }); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-destructive" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="autoresponders" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => handleOpenAutoresponderDialog()} disabled={accounts.length === 0}><Plus className="w-4 h-4 mr-2" />Add Autoresponder</Button></div>
          <div className="glass-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Email Account</TableHead><TableHead>Subject</TableHead><TableHead>Date Range</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {autoresponders.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{accounts.length === 0 ? "Create an email account first" : "No autoresponders found"}</TableCell></TableRow> : autoresponders.map((ar) => {
                  const account = accounts.find((candidate) => candidate.id === ar.email_account_id);
                  return <TableRow key={ar.id}><TableCell><div className="flex items-center gap-2"><MessageSquareReply className="w-4 h-4 text-warning" /><span className="font-medium">{account?.email || "Unknown"}</span></div></TableCell><TableCell className="max-w-xs truncate">{ar.subject}</TableCell><TableCell>{ar.start_date && ar.end_date ? `${new Date(ar.start_date).toLocaleDateString()} - ${new Date(ar.end_date).toLocaleDateString()}` : "Always active"}</TableCell><TableCell>{statusBadge(ar.is_active)}</TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-2"><Switch checked={ar.is_active} onCheckedChange={() => handleToggleActive("autoresponder", ar.id, ar.is_active)} /><Button variant="ghost" size="icon" onClick={() => handleOpenAutoresponderDialog(ar)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => { setDeleteTarget({ type: "autoresponder", id: ar.id, name: ar.subject }); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4 text-destructive" /></Button></div></TableCell></TableRow>;
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          {selectedSiteId ? (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">Spam / quarantine / relay controls</h3><Badge variant="outline">{settings?.spam_filter_provider ?? "rspamd"}</Badge></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2"><Label>SPF policy</Label><Textarea value={mailSettingsForm.spf_policy} onChange={(e) => setMailSettingsForm((v) => ({ ...v, spf_policy: e.target.value }))} className="bg-secondary border-border" /></div>
                    <div className="space-y-2 md:col-span-2"><Label>DMARC policy</Label><Textarea value={mailSettingsForm.dmarc_policy} onChange={(e) => setMailSettingsForm((v) => ({ ...v, dmarc_policy: e.target.value }))} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Filter engine</Label><Select value={mailSettingsForm.spam_filter_provider} onValueChange={(value) => setMailSettingsForm((v) => ({ ...v, spam_filter_provider: value }))}><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rspamd">Rspamd</SelectItem><SelectItem value="spamassassin">SpamAssassin</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Spam threshold</Label><Input type="number" step="0.1" value={mailSettingsForm.spam_threshold} onChange={(e) => setMailSettingsForm((v) => ({ ...v, spam_threshold: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
                    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3"><div><Label>Spam filtering</Label><p className="text-xs text-muted-foreground">Enable content scoring and policy actions.</p></div><Switch checked={mailSettingsForm.spam_filter_enabled} onCheckedChange={(checked) => setMailSettingsForm((v) => ({ ...v, spam_filter_enabled: checked }))} /></div>
                    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3"><div><Label>Quarantine</Label><p className="text-xs text-muted-foreground">Hold suspicious messages for review.</p></div><Switch checked={mailSettingsForm.quarantine_enabled} onCheckedChange={(checked) => setMailSettingsForm((v) => ({ ...v, quarantine_enabled: checked }))} /></div>
                    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 md:col-span-2"><div><Label>SMTP relay</Label><p className="text-xs text-muted-foreground">Use a smart host for outbound mail.</p></div><Switch checked={mailSettingsForm.smtp_relay_enabled} onCheckedChange={(checked) => setMailSettingsForm((v) => ({ ...v, smtp_relay_enabled: checked }))} /></div>
                    <div className="space-y-2"><Label>Relay host</Label><Input value={mailSettingsForm.smtp_relay_host} onChange={(e) => setMailSettingsForm((v) => ({ ...v, smtp_relay_host: e.target.value }))} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Relay port</Label><Input type="number" value={mailSettingsForm.smtp_relay_port} onChange={(e) => setMailSettingsForm((v) => ({ ...v, smtp_relay_port: Number(e.target.value) }))} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Relay username</Label><Input value={mailSettingsForm.smtp_relay_username} onChange={(e) => setMailSettingsForm((v) => ({ ...v, smtp_relay_username: e.target.value }))} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Password hint</Label><Input value={mailSettingsForm.smtp_relay_password_hint} onChange={(e) => setMailSettingsForm((v) => ({ ...v, smtp_relay_password_hint: e.target.value }))} className="bg-secondary border-border" /></div>
                    <div className="space-y-2"><Label>Webmail provider</Label><Select value={mailSettingsForm.webmail_provider} onValueChange={(value) => setMailSettingsForm((v) => ({ ...v, webmail_provider: value }))}><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="roundcube">Roundcube</SelectItem><SelectItem value="sogo">SOGo</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Webmail URL</Label><Input value={mailSettingsForm.webmail_url} onChange={(e) => setMailSettingsForm((v) => ({ ...v, webmail_url: e.target.value }))} className="bg-secondary border-border" /></div>
                  </div>
                  <div className="flex gap-2"><Button onClick={handleSaveMailSettings} disabled={saveMailSettings.isPending}>Save mail controls</Button><Button variant="outline" onClick={syncMailFormFromSettings}>Reset</Button>{mailSettingsForm.webmail_url ? <Button variant="outline" asChild><a href={mailSettingsForm.webmail_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 mr-2" />Open webmail</a></Button> : null}</div>
                </div>

                <div className="glass-card rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">DKIM publishing help</h3><Badge variant="outline">selector {settings?.dkim_selector ?? "default"}</Badge></div>
                  <div className="rounded-lg border border-border p-4 space-y-3 bg-secondary/20">
                    <p className="text-sm text-muted-foreground">Generate or rotate DKIM, then publish the TXT record below in DNS. SPF and DMARC are editable beside it for quick remediation.</p>
                    <p className="text-sm"><span className="font-medium">DNS host:</span> {settings?.dkim_selector ?? "default"}._domainkey.{selectedSiteId ? getSiteDomain(selectedSiteId) : "example.com"}</p>
                    <Textarea value={settings?.dkim_public_key ?? "Generate a key to populate the DNS value."} readOnly className="min-h-[120px] bg-secondary border-border text-xs" />
                    <div className="flex gap-2 flex-wrap"><Button onClick={() => handleGenerateDkim(false)} disabled={generateDkim.isPending}>Generate DKIM</Button><Button variant="outline" onClick={() => handleGenerateDkim(true)} disabled={rotateDkim.isPending}>Rotate DKIM</Button><Button variant="outline" onClick={handleDeliverabilityCheck} disabled={runDeliverabilityCheck.isPending}>Run blacklist / deliverability check</Button></div>
                  </div>
                  <div className="space-y-2">
                    {dkimRotations.length === 0 ? <p className="text-sm text-muted-foreground">No DKIM events yet.</p> : dkimRotations.slice(0, 4).map((rotation) => <div key={rotation.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-center justify-between gap-2"><span className="font-medium">{rotation.selector}</span><Badge variant="outline">{rotation.status}</Badge></div><p className="text-muted-foreground break-all">{rotation.dns_name}</p><p className="text-xs text-muted-foreground">{new Date(rotation.rotated_at).toLocaleString()}</p></div>)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">Mail queue viewer</h3><Badge variant="outline">{queue.length} items</Badge></div>
                  <Table>
                    <TableHeader><TableRow><TableHead>Queue</TableHead><TableHead>Recipient</TableHead><TableHead>Status</TableHead><TableHead>Reason</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {queue.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No queued mail for this site.</TableCell></TableRow> : queue.map((message) => <TableRow key={message.id}><TableCell><div className="font-medium">{message.queue_id}</div><div className="text-xs text-muted-foreground">{message.subject}</div></TableCell><TableCell>{message.recipient}</TableCell><TableCell><Badge variant="outline">{message.status}</Badge></TableCell><TableCell className="max-w-[240px] truncate">{message.reason ?? "—"}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => retryQueueMessage.mutate({ site_id: selectedSiteId, message_id: message.id })}>Retry</Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => purgeQueueMessage.mutate({ site_id: selectedSiteId, message_id: message.id })}>Purge</Button></div></TableCell></TableRow>)}
                    </TableBody>
                  </Table>
                </div>

                <div className="glass-card rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between"><h3 className="font-semibold">Quarantine & spam review</h3><Badge variant="outline">{activeQuarantine} active</Badge></div>
                  <div className="space-y-2">
                    {quarantine.length === 0 ? <p className="text-sm text-muted-foreground">No quarantined items.</p> : quarantine.map((item) => <div key={item.id} className="rounded-lg border border-border p-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{item.subject}</p><p className="text-sm text-muted-foreground">{item.sender} • score {item.spam_score}</p></div>{item.released_at ? <Badge variant="outline">released</Badge> : <Button size="sm" variant="outline" onClick={() => releaseQuarantineMessage.mutate({ site_id: selectedSiteId, quarantine_id: item.id })}>Release</Button>}</div><p className="text-xs text-muted-foreground mt-2">{item.detection_summary ?? "Suspicious content fingerprinted by spam engine."}</p></div>)}
                  </div>
                </div>
              </div>
            </>
          ) : <div className="glass-card rounded-xl p-6 text-muted-foreground">Select a site to manage mail operations, DKIM, relay routing, queue, and quarantine.</div>}
        </TabsContent>

        <TabsContent value="deliverability" className="space-y-4">
          {selectedSiteId ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between"><h3 className="font-semibold">Deliverability & blacklist posture</h3>{latestDeliverability ? deliverabilityBadge(latestDeliverability.status) : null}</div>
                {latestDeliverability ? (
                  <>
                    <div className="flex items-center gap-4"><Progress value={latestDeliverability.score} className="h-2" /><span className="font-semibold">{latestDeliverability.score}/100</span></div>
                    <div className="space-y-2">
                      <div><p className="text-sm font-medium">DNS warnings</p>{latestDeliverability.dns_warnings.length ? latestDeliverability.dns_warnings.map((warning) => <div key={warning} className="text-sm text-muted-foreground flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 text-warning" />{warning}</div>) : <p className="text-sm text-muted-foreground">No SPF / DMARC / DKIM warnings.</p>}</div>
                      <div><p className="text-sm font-medium">Blacklist hits</p>{latestDeliverability.blacklist_hits.length ? latestDeliverability.blacklist_hits.map((hit) => <div key={hit} className="text-sm text-muted-foreground flex items-start gap-2"><ShieldAlert className="w-4 h-4 mt-0.5 text-destructive" />{hit}</div>) : <p className="text-sm text-muted-foreground">No blacklist hits detected.</p>}</div>
                    </div>
                  </>
                ) : <p className="text-sm text-muted-foreground">Run a deliverability check to assess SPF, DMARC, DKIM, and blacklist status.</p>}
                <Button onClick={handleDeliverabilityCheck} disabled={runDeliverabilityCheck.isPending}><ShieldCheck className="w-4 h-4 mr-2" />Run deliverability check</Button>
              </div>
              <div className="glass-card rounded-xl p-4 space-y-4">
                <h3 className="font-semibold">Bounce diagnostics</h3>
                {bounceDiagnostics.length === 0 ? <p className="text-sm text-muted-foreground">No bounce diagnostics have been logged yet.</p> : bounceDiagnostics.map((bounce) => <div key={bounce.id} className="rounded-lg border border-border p-3"><div className="flex items-center justify-between gap-2"><span className="font-medium">{bounce.recipient}</span><Badge variant="outline">{bounce.bounce_class}</Badge></div><p className="text-sm text-muted-foreground mt-2">{bounce.diagnostic_code ?? bounce.status}</p><p className="text-xs text-muted-foreground mt-1">{bounce.recommended_action ?? "Inspect upstream SMTP response and remote policy."}</p></div>)}
              </div>
            </div>
          ) : <div className="glass-card rounded-xl p-6 text-muted-foreground">Choose a site to run deliverability and blacklist checks.</div>}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {selectedSiteId ? (
            <div className="glass-card rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold">SMTP logs / search</h3><Badge variant="outline">{filteredSmtpLogs.length} hits</Badge></div>
              <Table>
                <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Direction</TableHead><TableHead>Sender</TableHead><TableHead>Recipient</TableHead><TableHead>Status</TableHead><TableHead>Response</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredSmtpLogs.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No SMTP logs match your search.</TableCell></TableRow> : filteredSmtpLogs.map((log) => <TableRow key={log.id}><TableCell>{new Date(log.logged_at).toLocaleString()}</TableCell><TableCell>{log.direction}</TableCell><TableCell>{log.sender}</TableCell><TableCell>{log.recipient}</TableCell><TableCell><Badge variant="outline">{log.status}</Badge></TableCell><TableCell className="max-w-[300px] truncate">{log.response ?? log.remote_host ?? "—"}</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
          ) : <div className="glass-card rounded-xl p-6 text-muted-foreground">Select a site to inspect SMTP logs and search delivery events.</div>}
        </TabsContent>
      </Tabs>

      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}><DialogContent className="bg-card border-border"><DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" />{editingAccount ? "Edit Email Account" : "Create Email Account"}</DialogTitle><DialogDescription>{editingAccount ? "Update email account settings" : "Add a new email account to your domain"}</DialogDescription></DialogHeader><div className="space-y-4 py-4">{!editingAccount && <><div className="space-y-2"><Label>Site</Label><Select value={accountForm.site_id} onValueChange={(v) => setAccountForm({ ...accountForm, site_id: v })}><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select site" /></SelectTrigger><SelectContent>{sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Email Address</Label><Input placeholder="user@example.com" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} className="bg-secondary border-border" /></div><div className="space-y-2"><Label>Password</Label><Input type="password" placeholder="••••••••" value={accountForm.password} onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })} className="bg-secondary border-border" /></div></>}<div className="space-y-2"><Label>Storage Quota (MB)</Label><Input type="number" value={accountForm.quota_mb} onChange={(e) => setAccountForm({ ...accountForm, quota_mb: parseInt(e.target.value) || 1000 })} className="bg-secondary border-border" /></div></div><DialogFooter><Button variant="outline" onClick={() => setAccountDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveAccount} disabled={createAccount.isPending || updateAccount.isPending}>{(createAccount.isPending || updateAccount.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingAccount ? "Save Changes" : "Create Account"}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={forwarderDialogOpen} onOpenChange={setForwarderDialogOpen}><DialogContent className="bg-card border-border"><DialogHeader><DialogTitle className="flex items-center gap-2"><Forward className="w-5 h-5 text-info" />{editingForwarder ? "Edit Forwarder" : "Create Forwarder"}</DialogTitle><DialogDescription>Forward emails from one address to one or more destinations</DialogDescription></DialogHeader><div className="space-y-4 py-4">{!editingForwarder && <><div className="space-y-2"><Label>Site</Label><Select value={forwarderForm.site_id} onValueChange={(v) => setForwarderForm({ ...forwarderForm, site_id: v })}><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select site" /></SelectTrigger><SelectContent>{sites.map((site) => <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Source Email</Label><Input placeholder="info@example.com" value={forwarderForm.source_email} onChange={(e) => setForwarderForm({ ...forwarderForm, source_email: e.target.value })} className="bg-secondary border-border" /></div></>}<div className="space-y-2"><Label>Destination Emails (comma-separated)</Label><Textarea placeholder="user1@gmail.com, user2@gmail.com" value={forwarderForm.destination_emails} onChange={(e) => setForwarderForm({ ...forwarderForm, destination_emails: e.target.value })} className="bg-secondary border-border" /></div></div><DialogFooter><Button variant="outline" onClick={() => setForwarderDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveForwarder} disabled={createForwarder.isPending || updateForwarder.isPending}>{(createForwarder.isPending || updateForwarder.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingForwarder ? "Save Changes" : "Create Forwarder"}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={autoresponderDialogOpen} onOpenChange={setAutoresponderDialogOpen}><DialogContent className="bg-card border-border max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquareReply className="w-5 h-5 text-warning" />{editingAutoresponder ? "Edit Autoresponder" : "Create Autoresponder"}</DialogTitle><DialogDescription>Automatically reply to incoming emails</DialogDescription></DialogHeader><div className="space-y-4 py-4">{!editingAutoresponder && <div className="space-y-2"><Label>Email Account</Label><Select value={autoresponderForm.email_account_id} onValueChange={(v) => setAutoresponderForm({ ...autoresponderForm, email_account_id: v })}><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select email account" /></SelectTrigger><SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.email}</SelectItem>)}</SelectContent></Select></div>}<div className="space-y-2"><Label>Subject</Label><Input value={autoresponderForm.subject} onChange={(e) => setAutoresponderForm({ ...autoresponderForm, subject: e.target.value })} className="bg-secondary border-border" /></div><div className="space-y-2"><Label>Message</Label><Textarea value={autoresponderForm.body} onChange={(e) => setAutoresponderForm({ ...autoresponderForm, body: e.target.value })} className="bg-secondary border-border" rows={5} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Start Date</Label><Input type="date" value={autoresponderForm.start_date} onChange={(e) => setAutoresponderForm({ ...autoresponderForm, start_date: e.target.value })} className="bg-secondary border-border" /></div><div className="space-y-2"><Label>End Date</Label><Input type="date" value={autoresponderForm.end_date} onChange={(e) => setAutoresponderForm({ ...autoresponderForm, end_date: e.target.value })} className="bg-secondary border-border" /></div></div></div><DialogFooter><Button variant="outline" onClick={() => setAutoresponderDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveAutoresponder} disabled={createAutoresponder.isPending || updateAutoresponder.isPending}>{(createAutoresponder.isPending || updateAutoresponder.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editingAutoresponder ? "Save Changes" : "Create Autoresponder"}</Button></DialogFooter></DialogContent></Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}><AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>Delete {deleteTarget?.type}</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete {deleteTarget?.name}? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};
