import { useState } from "react";
import {
  Upload,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Search,
  Server,
  FolderOpen,
  Lock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import { useSites } from "@/hooks/useSites";

interface FTPAccount {
  id: string;
  username: string;
  siteId: string;
  homeDirectory: string;
  quotaMB: number;
  usedMB: number;
  status: "active" | "suspended" | "locked";
  lastLogin: string | null;
  createdAt: string;
}

// Mock data
const initialAccounts: FTPAccount[] = [
  {
    id: "1",
    username: "example_ftp",
    siteId: "site1",
    homeDirectory: "/var/www/example.com",
    quotaMB: 5000,
    usedMB: 1234,
    status: "active",
    lastLogin: "2026-02-02 10:30:00",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    username: "myapp_deploy",
    siteId: "site2",
    homeDirectory: "/var/www/myapp.io",
    quotaMB: 10000,
    usedMB: 4567,
    status: "active",
    lastLogin: "2026-02-01 18:45:00",
    createdAt: "2026-01-20",
  },
  {
    id: "3",
    username: "backup_user",
    siteId: "site1",
    homeDirectory: "/var/www/example.com/backups",
    quotaMB: 20000,
    usedMB: 15000,
    status: "suspended",
    lastLogin: null,
    createdAt: "2026-01-10",
  },
];

const mockSites = [
  { id: "site1", domain: "example.com" },
  { id: "site2", domain: "myapp.io" },
  { id: "site3", domain: "testsite.org" },
];

export const FTPManager = () => {
  const [accounts, setAccounts] = useState<FTPAccount[]>(initialAccounts);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FTPAccount | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    siteId: "",
    homeDirectory: "",
    quotaMB: 5000,
  });

  const getSiteDomain = (siteId: string) => {
    const site = mockSites.find((s) => s.id === siteId);
    return site?.domain || "Unknown";
  };

  const handleAddAccount = () => {
    if (!formData.username || !formData.password || !formData.siteId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Username, password, and site are required.",
      });
      return;
    }

    const newAccount: FTPAccount = {
      id: Date.now().toString(),
      username: formData.username,
      siteId: formData.siteId,
      homeDirectory: formData.homeDirectory || `/var/www/${getSiteDomain(formData.siteId)}`,
      quotaMB: formData.quotaMB,
      usedMB: 0,
      status: "active",
      lastLogin: null,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setAccounts([...accounts, newAccount]);
    setAddDialogOpen(false);
    setFormData({ username: "", password: "", siteId: "", homeDirectory: "", quotaMB: 5000 });

    toast({
      title: "FTP Account Created",
      description: `Account "${formData.username}" has been created.`,
    });
  };

  const handleDeleteAccount = () => {
    if (!selectedAccount) return;

    setAccounts(accounts.filter((a) => a.id !== selectedAccount.id));
    setDeleteDialogOpen(false);
    setSelectedAccount(null);

    toast({
      title: "FTP Account Deleted",
      description: "The FTP account has been removed.",
    });
  };

  const handleToggleStatus = (account: FTPAccount) => {
    const newStatus = account.status === "active" ? "suspended" : "active";
    setAccounts(
      accounts.map((a) =>
        a.id === account.id ? { ...a, status: newStatus } : a
      )
    );

    toast({
      title: newStatus === "active" ? "Account Activated" : "Account Suspended",
      description: `FTP account "${account.username}" has been ${newStatus}.`,
    });
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const filteredAccounts = accounts.filter(
    (account) =>
      account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSiteDomain(account.siteId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatQuota = (mb: number) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">FTP Accounts</h2>
          <p className="text-muted-foreground">Manage FTP access for your sites</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create FTP Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
              <p className="text-sm text-muted-foreground">Total Accounts</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {accounts.filter((a) => a.status === "active").length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {accounts.filter((a) => a.status === "suspended").length}
              </p>
              <p className="text-sm text-muted-foreground">Suspended</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Info */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">FTP Server Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Host:</span>
            <code className="ml-2 bg-muted px-2 py-1 rounded">ftp.amp-server.com</code>
          </div>
          <div>
            <span className="text-muted-foreground">Port:</span>
            <code className="ml-2 bg-muted px-2 py-1 rounded">21</code>
          </div>
          <div>
            <span className="text-muted-foreground">SFTP Port:</span>
            <code className="ml-2 bg-muted px-2 py-1 rounded">22</code>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Accounts Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Username</TableHead>
              <TableHead className="text-muted-foreground">Site</TableHead>
              <TableHead className="text-muted-foreground">Home Directory</TableHead>
              <TableHead className="text-muted-foreground">Quota</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Last Login</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No FTP accounts found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{account.username}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(account.username)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getSiteDomain(account.siteId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FolderOpen className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{account.homeDirectory}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-foreground">{formatQuota(account.usedMB)}</span>
                      <span className="text-muted-foreground"> / {formatQuota(account.quotaMB)}</span>
                    </div>
                    <div className="w-20 h-1.5 bg-muted rounded-full mt-1">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(account.usedMB / account.quotaMB) * 100}%` }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        account.status === "active"
                          ? "bg-success/20 text-success border-success/30"
                          : account.status === "suspended"
                          ? "bg-warning/20 text-warning border-warning/30"
                          : "bg-destructive/20 text-destructive border-destructive/30"
                      }
                    >
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {account.lastLogin || "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(account)}
                      >
                        {account.status === "active" ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedAccount(account);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create FTP Account</DialogTitle>
            <DialogDescription>Create a new FTP account for file access</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Site</Label>
              <Select
                value={formData.siteId}
                onValueChange={(value) => setFormData({ ...formData, siteId: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {mockSites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                placeholder="ftp_username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPasswords["new"] ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-secondary border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords["new"] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords["new"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Home Directory (optional)</Label>
              <Input
                placeholder="/var/www/domain.com"
                value={formData.homeDirectory}
                onChange={(e) => setFormData({ ...formData, homeDirectory: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Quota (MB)</Label>
              <Input
                type="number"
                value={formData.quotaMB}
                onChange={(e) => setFormData({ ...formData, quotaMB: parseInt(e.target.value) || 5000 })}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAccount}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FTP Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the FTP account "{selectedAccount?.username}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
