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
  AlertTriangle,
  Calendar,
  Settings2,
  Play,
  Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { useBackupSchedules, useCreateBackupSchedule, useUpdateBackupSchedule, useDeleteBackupSchedule, type BackupSchedule } from "@/hooks/useBackupSchedules";
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
  pending: { label: "Pending", icon: Clock, color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Loader2, color: "bg-info/20 text-info" },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-success/20 text-success" },
  failed: { label: "Failed", icon: XCircle, color: "bg-destructive/20 text-destructive" },
};

const frequencyConfig = {
  daily: { label: "Daily", description: "Every day at 2:00 AM" },
  weekly: { label: "Weekly", description: "Every Sunday at 2:00 AM" },
  monthly: { label: "Monthly", description: "1st of each month at 2:00 AM" },
};

export const BackupsManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteScheduleDialogOpen, setDeleteScheduleDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<BackupSchedule | null>(null);
  const [newBackup, setNewBackup] = useState({
    siteId: "",
    name: "",
    type: "full" as Backup["backup_type"],
    notes: "",
  });
  const [newSchedule, setNewSchedule] = useState({
    siteId: "",
    name: "",
    frequency: "daily" as BackupSchedule["frequency"],
    backupType: "full" as BackupSchedule["backup_type"],
    retentionDays: 30,
  });

  const { data: sites } = useSites();
  const { data: backups, isLoading, refetch } = useBackups(selectedSite || undefined);
  const { data: schedules, isLoading: schedulesLoading, refetch: refetchSchedules } = useBackupSchedules(selectedSite || undefined);
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const restoreBackup = useRestoreBackup();
  const createSchedule = useCreateBackupSchedule();
  const updateSchedule = useUpdateBackupSchedule();
  const deleteSchedule = useDeleteBackupSchedule();
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
  const activeSchedules = schedules?.filter((s) => s.is_enabled).length || 0;

  const handleCreate = async () => {
    if (!newBackup.siteId || !newBackup.name) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields." });
      return;
    }

    try {
      await createBackup.mutateAsync({
        site_id: newBackup.siteId,
        name: newBackup.name,
        backup_type: newBackup.type,
        notes: newBackup.notes || undefined,
      });
      toast({ title: "Backup created", description: `Backup "${newBackup.name}" has been created successfully.` });
      setIsCreateDialogOpen(false);
      setNewBackup({ siteId: "", name: "", type: "full", notes: "" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create backup." });
    }
  };

  const handleCreateSchedule = async () => {
    if (!newSchedule.siteId || !newSchedule.name) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields." });
      return;
    }

    try {
      await createSchedule.mutateAsync({
        site_id: newSchedule.siteId,
        name: newSchedule.name,
        frequency: newSchedule.frequency,
        backup_type: newSchedule.backupType,
        retention_days: newSchedule.retentionDays,
      });
      toast({ title: "Schedule created", description: `Backup schedule "${newSchedule.name}" has been created.` });
      setIsScheduleDialogOpen(false);
      setNewSchedule({ siteId: "", name: "", frequency: "daily", backupType: "full", retentionDays: 30 });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create schedule." });
    }
  };

  const handleToggleSchedule = async (schedule: BackupSchedule) => {
    try {
      await updateSchedule.mutateAsync({ id: schedule.id, is_enabled: !schedule.is_enabled });
      toast({
        title: schedule.is_enabled ? "Schedule paused" : "Schedule activated",
        description: `"${schedule.name}" has been ${schedule.is_enabled ? "paused" : "activated"}.`,
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update schedule." });
    }
  };

  const handleDelete = async () => {
    if (!selectedBackup) return;
    try {
      await deleteBackup.mutateAsync(selectedBackup.id);
      toast({ title: "Backup deleted", description: "The backup has been permanently deleted." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete backup." });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedBackup(null);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;
    try {
      await deleteSchedule.mutateAsync(selectedSchedule.id);
      toast({ title: "Schedule deleted", description: "The backup schedule has been deleted." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete schedule." });
    } finally {
      setDeleteScheduleDialogOpen(false);
      setSelectedSchedule(null);
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    try {
      await restoreBackup.mutateAsync(selectedBackup.id);
      toast({ title: "Restore complete", description: `Site has been restored from backup "${selectedBackup.name}".` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to restore backup." });
    } finally {
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
    }
  };

  const formatSize = (sizeMb: number) => sizeMb >= 1024 ? `${(sizeMb / 1024).toFixed(2)} GB` : `${sizeMb.toFixed(0)} MB`;

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

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
          <p className="text-muted-foreground">Create, manage, and schedule site backups</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsScheduleDialogOpen(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            New Schedule
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-primary to-info hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeSchedules}</p>
              <p className="text-sm text-muted-foreground">Active Schedules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="backups" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Archive className="w-4 h-4 mr-2" />
            Backups
          </TabsTrigger>
          <TabsTrigger value="schedules" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            Schedules
          </TabsTrigger>
        </TabsList>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search backups..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary border-border" />
            </div>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-full sm:w-[200px] bg-secondary border-border">
                <SelectValue placeholder="Filter by site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sites</SelectItem>
                {sites?.map((site) => (<SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
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
                  <TableRow><TableCell colSpan={7} className="text-center py-12"><div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-muted-foreground">Loading backups...</span></div></TableCell></TableRow>
                ) : filteredBackups?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12"><Archive className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">{searchQuery ? "No backups found matching your search" : "No backups yet"}</p>{!searchQuery && (<Button variant="link" onClick={() => setIsCreateDialogOpen(true)} className="mt-2">Create your first backup</Button>)}</TableCell></TableRow>
                ) : (
                  filteredBackups?.map((backup) => {
                    const TypeIcon = backupTypeConfig[backup.backup_type].icon;
                    const StatusIcon = statusConfig[backup.status].icon;
                    const expiry = getExpiryStatus(backup.expires_at);
                    return (
                      <TableRow key={backup.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Archive className="w-4 h-4 text-muted-foreground" /></div>
                            <div><p className="font-medium text-foreground">{backup.name}</p><p className="text-xs text-muted-foreground">{formatDate(backup.created_at)}</p></div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{getSiteDomain(backup.site_id)}</TableCell>
                        <TableCell><Badge variant="outline" className={backupTypeConfig[backup.backup_type].color}><TypeIcon className="w-3 h-3 mr-1" />{backupTypeConfig[backup.backup_type].label}</Badge></TableCell>
                        <TableCell><div className={`flex items-center gap-1.5 ${statusConfig[backup.status].color} px-2 py-1 rounded-md w-fit`}><StatusIcon className={`w-3.5 h-3.5 ${backup.status === "in_progress" ? "animate-spin" : ""}`} /><span className="text-xs font-medium">{statusConfig[backup.status].label}</span></div></TableCell>
                        <TableCell className="text-muted-foreground">{formatSize(Number(backup.size_mb))}</TableCell>
                        <TableCell>{expiry ? (<span className={`text-sm ${expiry.color}`}>{expiry.text}</span>) : (<span className="text-muted-foreground">-</span>)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted" disabled={backup.status !== "completed"} title="Download backup"><Download className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-warning hover:bg-warning/10" onClick={() => { setSelectedBackup(backup); setRestoreDialogOpen(true); }} disabled={backup.status !== "completed"} title="Restore backup"><RotateCcw className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { setSelectedBackup(backup); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
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

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => refetchSchedules()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Schedule</TableHead>
                  <TableHead className="text-muted-foreground">Site</TableHead>
                  <TableHead className="text-muted-foreground">Frequency</TableHead>
                  <TableHead className="text-muted-foreground">Retention</TableHead>
                  <TableHead className="text-muted-foreground">Next Run</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedulesLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12"><div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /><span className="text-muted-foreground">Loading schedules...</span></div></TableCell></TableRow>
                ) : schedules?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12"><Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No backup schedules yet</p><Button variant="link" onClick={() => setIsScheduleDialogOpen(true)} className="mt-2">Create your first schedule</Button></TableCell></TableRow>
                ) : (
                  schedules?.map((schedule) => (
                    <TableRow key={schedule.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Settings2 className="w-4 h-4 text-muted-foreground" /></div>
                          <div><p className="font-medium text-foreground">{schedule.name}</p><p className="text-xs text-muted-foreground">{backupTypeConfig[schedule.backup_type].label}</p></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{getSiteDomain(schedule.site_id)}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-info/20 text-info border-info/30">{frequencyConfig[schedule.frequency].label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{schedule.retention_days} days</TableCell>
                      <TableCell className="text-muted-foreground">{schedule.next_run_at ? formatDate(schedule.next_run_at) : "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={schedule.is_enabled} onCheckedChange={() => handleToggleSchedule(schedule)} />
                          <span className={`text-xs ${schedule.is_enabled ? "text-success" : "text-muted-foreground"}`}>{schedule.is_enabled ? "Active" : "Paused"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { setSelectedSchedule(schedule); setDeleteScheduleDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Backup Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Create Backup</DialogTitle><DialogDescription>Create a new backup of your site files and/or database</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Site</Label><Select value={newBackup.siteId} onValueChange={(v) => setNewBackup({ ...newBackup, siteId: v })}><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a site" /></SelectTrigger><SelectContent>{sites?.map((site) => (<SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Backup Name</Label><Input placeholder="e.g., Pre-update backup" value={newBackup.name} onChange={(e) => setNewBackup({ ...newBackup, name: e.target.value })} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Backup Type</Label><Select value={newBackup.type} onValueChange={(v) => setNewBackup({ ...newBackup, type: v as Backup["backup_type"] })}><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(backupTypeConfig) as [Backup["backup_type"], typeof backupTypeConfig["full"]][]).filter(([type]) => type !== "scheduled").map(([type, config]) => { const Icon = config.icon; return (<SelectItem key={type} value={type}><div className="flex items-center gap-2"><Icon className="w-4 h-4" /><span>{config.label}</span></div></SelectItem>); })}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Notes (Optional)</Label><Textarea placeholder="Add any notes..." value={newBackup.notes} onChange={(e) => setNewBackup({ ...newBackup, notes: e.target.value })} className="bg-secondary border-border resize-none" rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={createBackup.isPending} className="bg-gradient-to-r from-primary to-info">{createBackup.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>) : "Create Backup"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Create Backup Schedule</DialogTitle><DialogDescription>Set up automatic backups with retention policy</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Site</Label><Select value={newSchedule.siteId} onValueChange={(v) => setNewSchedule({ ...newSchedule, siteId: v })}><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a site" /></SelectTrigger><SelectContent>{sites?.map((site) => (<SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Schedule Name</Label><Input placeholder="e.g., Daily Production Backup" value={newSchedule.name} onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })} className="bg-secondary border-border" /></div>
            <div className="space-y-2"><Label>Frequency</Label><Select value={newSchedule.frequency} onValueChange={(v) => setNewSchedule({ ...newSchedule, frequency: v as BackupSchedule["frequency"] })}><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(frequencyConfig) as [BackupSchedule["frequency"], typeof frequencyConfig["daily"]][]).map(([freq, config]) => (<SelectItem key={freq} value={freq}><div><span>{config.label}</span><span className="text-xs text-muted-foreground ml-2">- {config.description}</span></div></SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Backup Type</Label><Select value={newSchedule.backupType} onValueChange={(v) => setNewSchedule({ ...newSchedule, backupType: v as BackupSchedule["backup_type"] })}><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(backupTypeConfig) as [BackupSchedule["backup_type"], typeof backupTypeConfig["full"]][]).filter(([type]) => type !== "scheduled").map(([type, config]) => { const Icon = config.icon; return (<SelectItem key={type} value={type}><div className="flex items-center gap-2"><Icon className="w-4 h-4" /><span>{config.label}</span></div></SelectItem>); })}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Retention (days)</Label><Select value={String(newSchedule.retentionDays)} onValueChange={(v) => setNewSchedule({ ...newSchedule, retentionDays: Number(v) })}><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 days</SelectItem><SelectItem value="14">14 days</SelectItem><SelectItem value="30">30 days</SelectItem><SelectItem value="60">60 days</SelectItem><SelectItem value="90">90 days</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">Backups older than this will be automatically deleted</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateSchedule} disabled={createSchedule.isPending} className="bg-gradient-to-r from-primary to-info">{createSchedule.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>) : "Create Schedule"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning" />Restore Backup</AlertDialogTitle><AlertDialogDescription>Are you sure you want to restore from backup "{selectedBackup?.name}"? This will overwrite current site data.<br /><br /><strong className="text-warning">This action cannot be undone.</strong></AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-border">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleRestore} className="bg-warning hover:bg-warning/90 text-warning-foreground">{restoreBackup.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Restoring...</>) : "Restore Backup"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Backup Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Delete Backup</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{selectedBackup?.name}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-border">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete Backup</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Schedule Dialog */}
      <AlertDialog open={deleteScheduleDialogOpen} onOpenChange={setDeleteScheduleDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>Delete Schedule</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the schedule "{selectedSchedule?.name}"? Existing backups will not be deleted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-border">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSchedule} className="bg-destructive hover:bg-destructive/90">Delete Schedule</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
