import { useState } from "react";
import { 
  Archive, 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  RotateCcw,
  RefreshCw,
  HardDrive,
  Database,
  FolderArchive,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useBackups, useCreateBackup, useDeleteBackup, useRestoreBackup, type Backup } from "@/hooks/useBackups";
import { useSites } from "@/hooks/useSites";
import { useToast } from "@/hooks/use-toast";

const backupTypeConfig = {
  full: {
    label: "Full Backup",
    icon: Archive,
    color: "bg-primary/20 text-primary border-primary/30",
    description: "Complete site backup including files and database",
  },
  files: {
    label: "Files Only",
    icon: FolderArchive,
    color: "bg-info/20 text-info border-info/30",
    description: "Backup all site files and folders",
  },
  database: {
    label: "Database Only",
    icon: Database,
    color: "bg-warning/20 text-warning border-warning/30",
    description: "Backup database tables and data",
  },
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    color: "bg-success/20 text-success border-success/30",
    description: "Automated scheduled backup",
  },
};

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "bg-muted text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    color: "bg-info/20 text-info",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "bg-success/20 text-success",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "bg-destructive/20 text-destructive",
  },
};

export const BackupsManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [newBackup, setNewBackup] = useState({
    siteId: "",
    name: "",
    type: "full" as Backup["backup_type"],
    notes: "",
  });

  const { data: sites } = useSites();
  const { data: backups, isLoading, refetch } = useBackups(selectedSite || undefined);
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const restoreBackup = useRestoreBackup();
  const { toast } = useToast();

  const getSiteDomain = (siteId: string) => {
    const site = sites?.find((s) => s.id === siteId);
    return site?.domain || "Unknown";
  };

  const filteredBackups = backups?.filter(
    (backup) =>
      backup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSiteDomain(backup.site_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBackupSize = backups?.reduce((acc, b) => acc + Number(b.size_mb), 0) || 0;
  const completedBackups = backups?.filter((b) => b.status === "completed").length || 0;

  const handleCreate = async () => {
    if (!newBackup.siteId || !newBackup.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields.",
      });
      return;
    }

    try {
      await createBackup.mutateAsync({
        site_id: newBackup.siteId,
        name: newBackup.name,
        backup_type: newBackup.type,
        notes: newBackup.notes || undefined,
      });

      toast({
        title: "Backup created",
        description: `Backup "${newBackup.name}" has been created successfully.`,
      });

      setIsCreateDialogOpen(false);
      setNewBackup({ siteId: "", name: "", type: "full", notes: "" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create backup.",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedBackup) return;

    try {
      await deleteBackup.mutateAsync(selectedBackup.id);
      toast({
        title: "Backup deleted",
        description: "The backup has been permanently deleted.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete backup.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBackup(null);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    try {
      await restoreBackup.mutateAsync(selectedBackup.id);
      toast({
        title: "Restore complete",
        description: `Site has been restored from backup "${selectedBackup.name}".`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to restore backup.",
      });
    } finally {
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
    }
  };

  const formatSize = (sizeMb: number) => {
    if (sizeMb >= 1024) {
      return `${(sizeMb / 1024).toFixed(2)} GB`;
    }
    return `${sizeMb.toFixed(0)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExpiryStatus = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { text: "Expired", color: "text-destructive" };
    if (daysLeft <= 7) return { text: `${daysLeft}d left`, color: "text-warning" };
    return { text: `${daysLeft}d left`, color: "text-muted-foreground" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Backup Management</h2>
          <p className="text-muted-foreground">
            Create, manage, and restore site backups
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-primary to-info hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Backup
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Archive className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{backups?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total Backups</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedBackups}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatSize(totalBackupSize)}</p>
              <p className="text-sm text-muted-foreground">Total Size</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search backups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-full sm:w-[200px] bg-secondary border-border">
            <SelectValue placeholder="Filter by site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sites</SelectItem>
            {sites?.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Backups Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Backup</TableHead>
              <TableHead className="text-muted-foreground">Site</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Size</TableHead>
              <TableHead className="text-muted-foreground">Expires</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-muted-foreground">Loading backups...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredBackups?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Archive className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No backups found matching your search" : "No backups yet"}
                  </p>
                  {!searchQuery && (
                    <Button
                      variant="link"
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="mt-2"
                    >
                      Create your first backup
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredBackups?.map((backup) => {
                const TypeIcon = backupTypeConfig[backup.backup_type].icon;
                const StatusIcon = statusConfig[backup.status].icon;
                const expiry = getExpiryStatus(backup.expires_at);

                return (
                  <TableRow key={backup.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Archive className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{backup.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(backup.created_at)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getSiteDomain(backup.site_id)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={backupTypeConfig[backup.backup_type].color}
                      >
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {backupTypeConfig[backup.backup_type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1.5 ${statusConfig[backup.status].color} px-2 py-1 rounded-md w-fit`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${backup.status === "in_progress" ? "animate-spin" : ""}`} />
                        <span className="text-xs font-medium">{statusConfig[backup.status].label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatSize(Number(backup.size_mb))}
                    </TableCell>
                    <TableCell>
                      {expiry ? (
                        <span className={`text-sm ${expiry.color}`}>{expiry.text}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground hover:bg-muted"
                          disabled={backup.status !== "completed"}
                          title="Download backup"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-warning hover:bg-warning/10"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreDialogOpen(true);
                          }}
                          disabled={backup.status !== "completed"}
                          title="Restore backup"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Create Backup Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
            <DialogDescription>
              Create a new backup of your site files and/or database
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Select value={newBackup.siteId} onValueChange={(v) => setNewBackup({ ...newBackup, siteId: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Backup Name</Label>
              <Input
                id="name"
                placeholder="e.g., Pre-update backup"
                value={newBackup.name}
                onChange={(e) => setNewBackup({ ...newBackup, name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Backup Type</Label>
              <Select value={newBackup.type} onValueChange={(v) => setNewBackup({ ...newBackup, type: v as Backup["backup_type"] })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(backupTypeConfig) as [Backup["backup_type"], typeof backupTypeConfig["full"]][])
                    .filter(([type]) => type !== "scheduled")
                    .map(([type, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <div>
                              <span>{config.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                - {config.description}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this backup..."
                value={newBackup.notes}
                onChange={(e) => setNewBackup({ ...newBackup, notes: e.target.value })}
                className="bg-secondary border-border resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={createBackup.isPending}
              className="bg-gradient-to-r from-primary to-info"
            >
              {createBackup.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Backup"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Restore Backup
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore from backup "{selectedBackup?.name}"? 
              This will overwrite all current site files and/or database with the backup contents.
              <br /><br />
              <strong className="text-warning">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              {restoreBackup.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Restore Backup"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the backup "{selectedBackup?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
