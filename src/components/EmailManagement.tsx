import { useState } from "react";
import {
  Mail,
  Plus,
  Search,
  Trash2,
  Edit,
  Forward,
  MessageSquareReply,
  CheckCircle2,
  XCircle,
  Loader2,
  HardDrive,
  MailPlus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSites } from "@/hooks/useSites";
import {
  useEmailAccounts,
  useCreateEmailAccount,
  useUpdateEmailAccount,
  useDeleteEmailAccount,
  useEmailForwarders,
  useCreateEmailForwarder,
  useUpdateEmailForwarder,
  useDeleteEmailForwarder,
  useEmailAutoresponders,
  useCreateEmailAutoresponder,
  useUpdateEmailAutoresponder,
  useDeleteEmailAutoresponder,
  EmailAccount,
  EmailForwarder,
  EmailAutoresponder,
} from "@/hooks/useEmailAccounts";
import { useToast } from "@/hooks/use-toast";

export const EmailManagement = () => {
  const [activeTab, setActiveTab] = useState("accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("all");

  const selectedSiteId = selectedSite === "all" ? undefined : selectedSite;

  const { data: sites = [] } = useSites();
  const { data: accounts = [], isLoading: accountsLoading } = useEmailAccounts(selectedSiteId);
  const { data: forwarders = [], isLoading: forwardersLoading } = useEmailForwarders(selectedSiteId);
  const { data: autoresponders = [] } = useEmailAutoresponders();

  const { toast } = useToast();

  // Account Dialog State
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);
  const [accountForm, setAccountForm] = useState({ email: "", password: "", quota_mb: 1000, site_id: "" });

  // Forwarder Dialog State
  const [forwarderDialogOpen, setForwarderDialogOpen] = useState(false);
  const [editingForwarder, setEditingForwarder] = useState<EmailForwarder | null>(null);
  const [forwarderForm, setForwarderForm] = useState({ source_email: "", destination_emails: "", site_id: "" });

  // Autoresponder Dialog State
  const [autoresponderDialogOpen, setAutoresponderDialogOpen] = useState(false);
  const [editingAutoresponder, setEditingAutoresponder] = useState<EmailAutoresponder | null>(null);
  const [autoresponderForm, setAutoresponderForm] = useState({
    email_account_id: "",
    subject: "",
    body: "",
    start_date: "",
    end_date: "",
  });

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; name: string } | null>(null);

  // Mutations
  const createAccount = useCreateEmailAccount();
  const updateAccount = useUpdateEmailAccount();
  const deleteAccount = useDeleteEmailAccount();
  const createForwarder = useCreateEmailForwarder();
  const updateForwarder = useUpdateEmailForwarder();
  const deleteForwarder = useDeleteEmailForwarder();
  const createAutoresponder = useCreateEmailAutoresponder();
  const updateAutoresponder = useUpdateEmailAutoresponder();
  const deleteAutoresponder = useDeleteEmailAutoresponder();

  // Handlers
  const handleOpenAccountDialog = (account?: EmailAccount) => {
    if (account) {
      setEditingAccount(account);
      setAccountForm({
        email: account.email,
        password: "",
        quota_mb: account.quota_mb,
        site_id: account.site_id,
      });
    } else {
      setEditingAccount(null);
      setAccountForm({ email: "", password: "", quota_mb: 1000, site_id: sites[0]?.id || "" });
    }
    setAccountDialogOpen(true);
  };

  const handleSaveAccount = async () => {
    try {
      if (editingAccount) {
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          quota_mb: accountForm.quota_mb,
        });
        toast({ title: "Email account updated" });
      } else {
        await createAccount.mutateAsync({
          site_id: accountForm.site_id,
          email: accountForm.email,
          password_hash: accountForm.password,
          quota_mb: accountForm.quota_mb,
        });
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
      setForwarderForm({
        source_email: forwarder.source_email,
        destination_emails: forwarder.destination_emails.join(", "),
        site_id: forwarder.site_id,
      });
    } else {
      setEditingForwarder(null);
      setForwarderForm({ source_email: "", destination_emails: "", site_id: sites[0]?.id || "" });
    }
    setForwarderDialogOpen(true);
  };

  const handleSaveForwarder = async () => {
    try {
      const destinations = forwarderForm.destination_emails.split(",").map((e) => e.trim()).filter(Boolean);
      if (editingForwarder) {
        await updateForwarder.mutateAsync({
          id: editingForwarder.id,
          destination_emails: destinations,
        });
        toast({ title: "Forwarder updated" });
      } else {
        await createForwarder.mutateAsync({
          site_id: forwarderForm.site_id,
          source_email: forwarderForm.source_email,
          destination_emails: destinations,
        });
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
      setAutoresponderForm({
        email_account_id: accounts[0]?.id || "",
        subject: "",
        body: "",
        start_date: "",
        end_date: "",
      });
    }
    setAutoresponderDialogOpen(true);
  };

  const handleSaveAutoresponder = async () => {
    try {
      if (editingAutoresponder) {
        await updateAutoresponder.mutateAsync({
          id: editingAutoresponder.id,
          subject: autoresponderForm.subject,
          body: autoresponderForm.body,
          start_date: autoresponderForm.start_date || null,
          end_date: autoresponderForm.end_date || null,
        });
        toast({ title: "Autoresponder updated" });
      } else {
        await createAutoresponder.mutateAsync({
          email_account_id: autoresponderForm.email_account_id,
          subject: autoresponderForm.subject,
          body: autoresponderForm.body,
          start_date: autoresponderForm.start_date || undefined,
          end_date: autoresponderForm.end_date || undefined,
        });
        toast({ title: "Autoresponder created" });
      }
      setAutoresponderDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleToggleActive = async (type: string, id: string, currentState: boolean) => {
    try {
      if (type === "account") {
        await updateAccount.mutateAsync({ id, is_active: !currentState });
      } else if (type === "forwarder") {
        await updateForwarder.mutateAsync({ id, is_active: !currentState });
      } else if (type === "autoresponder") {
        await updateAutoresponder.mutateAsync({ id, is_active: !currentState });
      }
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${!currentState ? "enabled" : "disabled"}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "account") {
        await deleteAccount.mutateAsync(deleteTarget.id);
      } else if (deleteTarget.type === "forwarder") {
        await deleteForwarder.mutateAsync(deleteTarget.id);
      } else if (deleteTarget.type === "autoresponder") {
        await deleteAutoresponder.mutateAsync(deleteTarget.id);
      }
      toast({ title: `${deleteTarget.type.charAt(0).toUpperCase() + deleteTarget.type.slice(1)} deleted` });
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const filteredAccounts = accounts.filter((a) =>
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredForwarders = forwarders.filter(
    (f) =>
      f.source_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.destination_emails.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSiteDomain = (siteId: string) => sites.find((s) => s.id === siteId)?.domain || "Unknown";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Management</h2>
          <p className="text-muted-foreground">Manage email accounts, forwarders, and autoresponders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-[200px] bg-secondary border-border">
            <SelectValue placeholder="Filter by site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Accounts ({accounts.length})
          </TabsTrigger>
          <TabsTrigger value="forwarders" className="flex items-center gap-2">
            <Forward className="w-4 h-4" />
            Forwarders ({forwarders.length})
          </TabsTrigger>
          <TabsTrigger value="autoresponders" className="flex items-center gap-2">
            <MessageSquareReply className="w-4 h-4" />
            Autoresponders ({autoresponders.length})
          </TabsTrigger>
        </TabsList>

        {/* Email Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenAccountDialog()} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Email Account
            </Button>
          </div>

          <div className="glass-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Site</TableHead>
                  <TableHead className="text-muted-foreground">Storage</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No email accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">{account.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{getSiteDomain(account.site_id)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <HardDrive className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {account.used_mb} / {account.quota_mb} MB
                            </span>
                          </div>
                          <Progress value={(account.used_mb / account.quota_mb) * 100} className="h-1.5 w-24" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={account.is_active ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground"}
                        >
                          {account.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {account.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={account.is_active}
                            onCheckedChange={() => handleToggleActive("account", account.id, account.is_active)}
                          />
                          <Button variant="ghost" size="icon" onClick={() => handleOpenAccountDialog(account)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteTarget({ type: "account", id: account.id, name: account.email });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Forwarders Tab */}
        <TabsContent value="forwarders" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenForwarderDialog()} className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Forwarder
            </Button>
          </div>

          <div className="glass-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Source</TableHead>
                  <TableHead className="text-muted-foreground">Destinations</TableHead>
                  <TableHead className="text-muted-foreground">Site</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forwardersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredForwarders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No forwarders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredForwarders.map((forwarder) => (
                    <TableRow key={forwarder.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MailPlus className="w-4 h-4 text-info" />
                          <span className="font-medium text-foreground">{forwarder.source_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          {forwarder.destination_emails.map((dest, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {dest}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{getSiteDomain(forwarder.site_id)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={forwarder.is_active ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground"}
                        >
                          {forwarder.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={forwarder.is_active}
                            onCheckedChange={() => handleToggleActive("forwarder", forwarder.id, forwarder.is_active)}
                          />
                          <Button variant="ghost" size="icon" onClick={() => handleOpenForwarderDialog(forwarder)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteTarget({ type: "forwarder", id: forwarder.id, name: forwarder.source_email });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Autoresponders Tab */}
        <TabsContent value="autoresponders" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenAutoresponderDialog()} className="bg-primary" disabled={accounts.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Autoresponder
            </Button>
          </div>

          <div className="glass-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Email Account</TableHead>
                  <TableHead className="text-muted-foreground">Subject</TableHead>
                  <TableHead className="text-muted-foreground">Date Range</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {autoresponders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {accounts.length === 0 ? "Create an email account first" : "No autoresponders found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  autoresponders.map((ar) => {
                    const account = accounts.find((a) => a.id === ar.email_account_id);
                    return (
                      <TableRow key={ar.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MessageSquareReply className="w-4 h-4 text-warning" />
                            <span className="font-medium text-foreground">{account?.email || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground max-w-xs truncate">{ar.subject}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {ar.start_date && ar.end_date
                            ? `${new Date(ar.start_date).toLocaleDateString()} - ${new Date(ar.end_date).toLocaleDateString()}`
                            : "Always active"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={ar.is_active ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground"}
                          >
                            {ar.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={ar.is_active}
                              onCheckedChange={() => handleToggleActive("autoresponder", ar.id, ar.is_active)}
                            />
                            <Button variant="ghost" size="icon" onClick={() => handleOpenAutoresponderDialog(ar)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteTarget({ type: "autoresponder", id: ar.id, name: ar.subject });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Email Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              {editingAccount ? "Edit Email Account" : "Create Email Account"}
            </DialogTitle>
            <DialogDescription>
              {editingAccount ? "Update email account settings" : "Add a new email account to your domain"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingAccount && (
              <>
                <div className="space-y-2">
                  <Label>Site</Label>
                  <Select value={accountForm.site_id} onValueChange={(v) => setAccountForm({ ...accountForm, site_id: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    placeholder="user@example.com"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Storage Quota (MB)</Label>
              <Input
                type="number"
                value={accountForm.quota_mb}
                onChange={(e) => setAccountForm({ ...accountForm, quota_mb: parseInt(e.target.value) || 1000 })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAccount} disabled={createAccount.isPending || updateAccount.isPending}>
              {(createAccount.isPending || updateAccount.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingAccount ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forwarder Dialog */}
      <Dialog open={forwarderDialogOpen} onOpenChange={setForwarderDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Forward className="w-5 h-5 text-info" />
              {editingForwarder ? "Edit Forwarder" : "Create Forwarder"}
            </DialogTitle>
            <DialogDescription>
              Forward emails from one address to one or more destinations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingForwarder && (
              <>
                <div className="space-y-2">
                  <Label>Site</Label>
                  <Select value={forwarderForm.site_id} onValueChange={(v) => setForwarderForm({ ...forwarderForm, site_id: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source Email</Label>
                  <Input
                    placeholder="info@example.com"
                    value={forwarderForm.source_email}
                    onChange={(e) => setForwarderForm({ ...forwarderForm, source_email: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Destination Emails (comma-separated)</Label>
              <Textarea
                placeholder="user1@gmail.com, user2@gmail.com"
                value={forwarderForm.destination_emails}
                onChange={(e) => setForwarderForm({ ...forwarderForm, destination_emails: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForwarderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveForwarder} disabled={createForwarder.isPending || updateForwarder.isPending}>
              {(createForwarder.isPending || updateForwarder.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingForwarder ? "Save Changes" : "Create Forwarder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Autoresponder Dialog */}
      <Dialog open={autoresponderDialogOpen} onOpenChange={setAutoresponderDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareReply className="w-5 h-5 text-warning" />
              {editingAutoresponder ? "Edit Autoresponder" : "Create Autoresponder"}
            </DialogTitle>
            <DialogDescription>
              Automatically reply to incoming emails
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingAutoresponder && (
              <div className="space-y-2">
                <Label>Email Account</Label>
                <Select
                  value={autoresponderForm.email_account_id}
                  onValueChange={(v) => setAutoresponderForm({ ...autoresponderForm, email_account_id: v })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select email account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>{account.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Out of Office"
                value={autoresponderForm.subject}
                onChange={(e) => setAutoresponderForm({ ...autoresponderForm, subject: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Message Body</Label>
              <Textarea
                placeholder="Thank you for your email. I am currently out of the office..."
                value={autoresponderForm.body}
                onChange={(e) => setAutoresponderForm({ ...autoresponderForm, body: e.target.value })}
                className="bg-secondary border-border min-h-[120px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date (optional)</Label>
                <Input
                  type="date"
                  value={autoresponderForm.start_date}
                  onChange={(e) => setAutoresponderForm({ ...autoresponderForm, start_date: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Input
                  type="date"
                  value={autoresponderForm.end_date}
                  onChange={(e) => setAutoresponderForm({ ...autoresponderForm, end_date: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoresponderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAutoresponder} disabled={createAutoresponder.isPending || updateAutoresponder.isPending}>
              {(createAutoresponder.isPending || updateAutoresponder.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingAutoresponder ? "Save Changes" : "Create Autoresponder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
