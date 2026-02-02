import { useState } from "react";
import {
  Globe,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Link2,
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

interface Subdomain {
  id: string;
  name: string;
  parentDomain: string;
  documentRoot: string;
  sslEnabled: boolean;
  status: "active" | "pending" | "error";
  redirectUrl?: string;
  createdAt: string;
}

// Mock data
const initialSubdomains: Subdomain[] = [
  {
    id: "1",
    name: "www",
    parentDomain: "example.com",
    documentRoot: "/var/www/example.com/public",
    sslEnabled: true,
    status: "active",
    createdAt: "2026-01-15",
  },
  {
    id: "2",
    name: "api",
    parentDomain: "example.com",
    documentRoot: "/var/www/example.com/api",
    sslEnabled: true,
    status: "active",
    createdAt: "2026-01-18",
  },
  {
    id: "3",
    name: "staging",
    parentDomain: "example.com",
    documentRoot: "/var/www/example.com/staging",
    sslEnabled: true,
    status: "active",
    createdAt: "2026-01-20",
  },
  {
    id: "4",
    name: "blog",
    parentDomain: "example.com",
    documentRoot: "/var/www/example.com/blog",
    sslEnabled: false,
    status: "pending",
    createdAt: "2026-02-01",
  },
  {
    id: "5",
    name: "dev",
    parentDomain: "myapp.io",
    documentRoot: "/var/www/myapp.io/dev",
    sslEnabled: true,
    status: "active",
    createdAt: "2026-01-22",
  },
  {
    id: "6",
    name: "cdn",
    parentDomain: "myapp.io",
    documentRoot: "",
    sslEnabled: true,
    status: "active",
    redirectUrl: "https://cdn.cloudflare.com",
    createdAt: "2026-01-25",
  },
];

const parentDomains = ["example.com", "myapp.io", "testsite.org"];

export const SubdomainManager = () => {
  const [subdomains, setSubdomains] = useState<Subdomain[]>(initialSubdomains);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSubdomain, setEditingSubdomain] = useState<Subdomain | null>(null);
  const [subdomainToDelete, setSubdomainToDelete] = useState<Subdomain | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    parentDomain: "",
    documentRoot: "",
    sslEnabled: true,
    redirectUrl: "",
  });

  const handleAddSubdomain = () => {
    setEditingSubdomain(null);
    setFormData({
      name: "",
      parentDomain: "",
      documentRoot: "",
      sslEnabled: true,
      redirectUrl: "",
    });
    setAddDialogOpen(true);
  };

  const handleEditSubdomain = (subdomain: Subdomain) => {
    setEditingSubdomain(subdomain);
    setFormData({
      name: subdomain.name,
      parentDomain: subdomain.parentDomain,
      documentRoot: subdomain.documentRoot,
      sslEnabled: subdomain.sslEnabled,
      redirectUrl: subdomain.redirectUrl || "",
    });
    setAddDialogOpen(true);
  };

  const handleSaveSubdomain = () => {
    if (!formData.name || !formData.parentDomain) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Subdomain name and parent domain are required.",
      });
      return;
    }

    if (editingSubdomain) {
      setSubdomains(
        subdomains.map((s) =>
          s.id === editingSubdomain.id
            ? {
                ...s,
                name: formData.name,
                parentDomain: formData.parentDomain,
                documentRoot: formData.documentRoot,
                sslEnabled: formData.sslEnabled,
                redirectUrl: formData.redirectUrl || undefined,
                status: "pending" as const,
              }
            : s
        )
      );
      toast({
        title: "Subdomain Updated",
        description: `${formData.name}.${formData.parentDomain} has been updated.`,
      });
    } else {
      const newSubdomain: Subdomain = {
        id: Date.now().toString(),
        name: formData.name,
        parentDomain: formData.parentDomain,
        documentRoot: formData.documentRoot || `/var/www/${formData.parentDomain}/${formData.name}`,
        sslEnabled: formData.sslEnabled,
        status: "pending",
        redirectUrl: formData.redirectUrl || undefined,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setSubdomains([...subdomains, newSubdomain]);
      toast({
        title: "Subdomain Created",
        description: `${formData.name}.${formData.parentDomain} has been created.`,
      });
    }

    setAddDialogOpen(false);
  };

  const handleDeleteSubdomain = () => {
    if (!subdomainToDelete) return;

    setSubdomains(subdomains.filter((s) => s.id !== subdomainToDelete.id));
    setDeleteDialogOpen(false);
    setSubdomainToDelete(null);

    toast({
      title: "Subdomain Deleted",
      description: "The subdomain has been removed.",
    });
  };

  const filteredSubdomains = subdomains.filter((subdomain) => {
    const matchesSearch =
      subdomain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subdomain.parentDomain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = filterDomain === "all" || subdomain.parentDomain === filterDomain;
    return matchesSearch && matchesDomain;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-success/20 text-success border-success/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Subdomains</h2>
          <p className="text-muted-foreground">Manage subdomains for your domains</p>
        </div>
        <Button onClick={handleAddSubdomain}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subdomain
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{subdomains.length}</p>
              <p className="text-sm text-muted-foreground">Total Subdomains</p>
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
                {subdomains.filter((s) => s.status === "active").length}
              </p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {subdomains.filter((s) => s.sslEnabled).length}
              </p>
              <p className="text-sm text-muted-foreground">SSL Enabled</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {subdomains.filter((s) => s.redirectUrl).length}
              </p>
              <p className="text-sm text-muted-foreground">Redirects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search subdomains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Select value={filterDomain} onValueChange={setFilterDomain}>
          <SelectTrigger className="w-[180px] bg-secondary border-border">
            <SelectValue placeholder="Filter by domain" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Domains</SelectItem>
            {parentDomains.map((domain) => (
              <SelectItem key={domain} value={domain}>
                {domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Subdomains Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Subdomain</TableHead>
              <TableHead className="text-muted-foreground">Document Root / Redirect</TableHead>
              <TableHead className="text-muted-foreground">SSL</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Created</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubdomains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Globe className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No subdomains found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubdomains.map((subdomain) => (
                <TableRow key={subdomain.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={`https://${subdomain.name}.${subdomain.parentDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {subdomain.name}.{subdomain.parentDomain}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    {subdomain.redirectUrl ? (
                      <div className="flex items-center gap-1 text-sm">
                        <ExternalLink className="w-3 h-3 text-warning" />
                        <span className="text-warning">→ {subdomain.redirectUrl}</span>
                      </div>
                    ) : (
                      <code className="text-sm text-muted-foreground">{subdomain.documentRoot}</code>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        subdomain.sslEnabled
                          ? "bg-success/20 text-success border-success/30"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {subdomain.sslEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(subdomain.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {subdomain.createdAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditSubdomain(subdomain)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSubdomainToDelete(subdomain);
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

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {editingSubdomain ? "Edit Subdomain" : "Add Subdomain"}
            </DialogTitle>
            <DialogDescription>
              {editingSubdomain
                ? "Update subdomain settings"
                : "Create a new subdomain for your domain"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subdomain Name</Label>
                <Input
                  placeholder="www, api, blog, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Domain</Label>
                <Select
                  value={formData.parentDomain}
                  onValueChange={(value) => setFormData({ ...formData, parentDomain: value })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {parentDomains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Document Root (leave empty for default)</Label>
              <Input
                placeholder="/var/www/domain.com/subdomain"
                value={formData.documentRoot}
                onChange={(e) => setFormData({ ...formData, documentRoot: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Redirect URL (optional)</Label>
              <Input
                placeholder="https://external-service.com"
                value={formData.redirectUrl}
                onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                If set, requests will be redirected to this URL
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sslEnabled"
                checked={formData.sslEnabled}
                onChange={(e) => setFormData({ ...formData, sslEnabled: e.target.checked })}
                className="rounded border-border"
              />
              <Label htmlFor="sslEnabled">Enable SSL (Let's Encrypt)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSubdomain}>
              {editingSubdomain ? "Save Changes" : "Create Subdomain"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subdomain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {subdomainToDelete?.name}.
              {subdomainToDelete?.parentDomain}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubdomain}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Subdomain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
