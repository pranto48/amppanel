import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FolderArchive,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  useBackups,
  useCreateBackup,
  useDeleteBackup,
  useRestoreBackup,
  useRestorePreview,
  type Backup,
  type RestoreMode,
  type RestorePreviewResult,
} from "@/hooks/useBackups";
import { useBackupSchedules, useCreateBackupSchedule, useDeleteBackupSchedule, useUpdateBackupSchedule, type BackupSchedule } from "@/hooks/useBackupSchedules";
import { useSites } from "@/hooks/useSites";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import { useLogActivity } from "@/hooks/useActivityLogs";

const backupTypeConfig = {
  full: {
    label: "Full Backup",
    icon: Archive,
    color: "bg-primary/20 text-primary border-primary/30",
    description: "Files + database snapshot with point-in-time metadata.",
  },
  files: {
    label: "Files Only",
    icon: FolderArchive,
    color: "bg-info/20 text-info border-info/30",
    description: "Filesystem snapshot only for path-level restores.",
  },
  database: {
    label: "Database Only",
    icon: Database,
    color: "bg-warning/20 text-warning border-warning/30",
    description: "Database dump optimized for PITR and DB-only restores.",
  },
  scheduled: {
    label: "Scheduled",
    icon: Clock,
    color: "bg-success/20 text-success border-success/30",
    description: "Automated scheduled backup.",
  },
} as const;

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", icon: Loader2, color: "bg-info/20 text-info" },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-success/20 text-success" },
  failed: { label: "Failed", icon: XCircle, color: "bg-destructive/20 text-destructive" },
} as const;

const verificationConfig = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
  verified: { label: "Verified", color: "bg-success/20 text-success" },
  warning: { label: "Warning", color: "bg-warning/20 text-warning" },
  failed: { label: "Failed", color: "bg-destructive/20 text-destructive" },
} as const;

const providerConfig = {
  s3: { label: "Amazon S3" },
  backblaze_b2: { label: "Backblaze B2" },
  wasabi: { label: "Wasabi" },
  gcs: { label: "Google Cloud Storage" },
} as const;

const frequencyConfig = {
  daily: { label: "Daily", description: "Every day at 2:00 AM" },
  weekly: { label: "Weekly", description: "Every Sunday at 2:00 AM" },
  monthly: { label: "Monthly", description: "1st of each month at 2:00 AM" },
} as const;

export const BackupsManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteScheduleDialogOpen, setDeleteScheduleDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<BackupSchedule | null>(null);
  const [restorePreview, setRestorePreview] = useState<RestorePreviewResult | null>(null);
  const [newBackup, setNewBackup] = useState({
    siteId: "",
    name: "",
    type: "full" as Backup["backup_type"],
    notes: "",
    provider: "s3" as NonNullable<Backup["storage_provider"]>,
    bucket: "",
    region: "",
    pointInTimeReference: new Date().toISOString().slice(0, 16),
  });
  const [restoreConfig, setRestoreConfig] = useState({
    mode: "full" as RestoreMode,
    pointInTimeTarget: "",
    targetPath: "",
    targetDatabase: "",
    overwriteConfirmed: false,
  });
  const [newSchedule, setNewSchedule] = useState({
    siteId: "",
    name: "",
    frequency: "daily" as BackupSchedule["frequency"],
    backupType: "full" as BackupSchedule["backup_type"],
    retentionDays: 30,
  });

  const { data: sites } = useSites();
  const selectedSiteId = selectedSite === "all" ? undefined : selectedSite;
  const { data: backups, isLoading, refetch } = useBackups(selectedSiteId);
  const { data: schedules, isLoading: schedulesLoading, refetch: refetchSchedules } = useBackupSchedules(selectedSiteId);
  const createBackup = useCreateBackup();
  const deleteBackup = useDeleteBackup();
  const restorePreviewMutation = useRestorePreview();
  const restoreBackup = useRestoreBackup();
  const createSchedule = useCreateBackupSchedule();
  const updateSchedule = useUpdateBackupSchedule();
  const deleteSchedule = useDeleteBackupSchedule();
  const { toast } = useToast();
  const { notifyBackupComplete, notifyBackupFailed, notifyScheduledBackup } = useNotifications();
  const { logBackupCreated, logBackupRestored } = useLogActivity();

  const getSiteDomain = (siteId: string) => sites?.find((s) => s.id === siteId)?.domain || "Unknown";

  const filteredBackups = useMemo(
    () => backups?.filter((backup) =>
      backup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSiteDomain(backup.site_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (backup.storage_provider ? providerConfig[backup.storage_provider].label.toLowerCase().includes(searchQuery.toLowerCase()) : false),
    ),
    [backups, searchQuery, sites],
  );

  const totalBackupSize = backups?.reduce((acc, b) => acc + Number(b.size_mb), 0) || 0;
  const completedBackups = backups?.filter((b) => b.status === "completed").length || 0;
  const verifiedBackups = backups?.filter((b) => b.verification_status === "verified").length || 0;
  const activeSchedules = schedules?.filter((s) => s.is_enabled).length || 0;

  const handleCreate = async () => {
    if (!newBackup.siteId || !newBackup.name) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields." });
      return;
    }

    const siteDomain = getSiteDomain(newBackup.siteId);

    try {
      const result = await createBackup.mutateAsync({
        site_id: newBackup.siteId,
        name: newBackup.name,
        backup_type: newBackup.type,
        notes: newBackup.notes || undefined,
        storage_provider: newBackup.provider,
        storage_bucket: newBackup.bucket || undefined,
        storage_region: newBackup.region || undefined,
        point_in_time_reference: newBackup.pointInTimeReference ? new Date(newBackup.pointInTimeReference).toISOString() : undefined,
      });

      logBackupCreated(newBackup.name, newBackup.siteId, newBackup.type);
      notifyBackupComplete(newBackup.name, siteDomain, result.id, newBackup.siteId);

      toast({
        title: "Backup created",
        description: `Stored ${newBackup.type} backup in ${providerConfig[newBackup.provider].label} with a verified checksum.`,
      });
      setIsCreateDialogOpen(false);
      setNewBackup({
        siteId: "",
        name: "",
        type: "full",
        notes: "",
        provider: "s3",
        bucket: "",
        region: "",
        pointInTimeReference: new Date().toISOString().slice(0, 16),
      });
    } catch (error: any) {
      notifyBackupFailed(newBackup.name, siteDomain, error.message);
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create backup." });
    }
  };

  const handleCreateSchedule = async () => {
    if (!newSchedule.siteId || !newSchedule.name) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields." });
      return;
    }

    const siteDomain = getSiteDomain(newSchedule.siteId);

    try {
      await createSchedule.mutateAsync({
        site_id: newSchedule.siteId,
        name: newSchedule.name,
        frequency: newSchedule.frequency,
        backup_type: newSchedule.backupType,
        retention_days: newSchedule.retentionDays,
      });
      notifyScheduledBackup(newSchedule.name, siteDomain, frequencyConfig[newSchedule.frequency].description);
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

  const openRestoreDialog = (backup: Backup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
    setRestorePreview(null);
    setRestoreConfig({
      mode: backup.contains_files && backup.contains_database ? "full" : backup.contains_files ? "files_only" : "database_only",
      pointInTimeTarget: backup.point_in_time_reference ? backup.point_in_time_reference.slice(0, 16) : "",
      targetPath: "",
      targetDatabase: "",
      overwriteConfirmed: false,
    });
  };

  const handlePreviewRestore = async () => {
    if (!selectedBackup) return;
    try {
      const preview = await restorePreviewMutation.mutateAsync({
        backup: selectedBackup,
        mode: restoreConfig.mode,
        pointInTimeTarget: restoreConfig.pointInTimeTarget ? new Date(restoreConfig.pointInTimeTarget).toISOString() : null,
        targetPath: restoreConfig.targetPath || null,
        targetDatabase: restoreConfig.targetDatabase || null,
        overwriteConfirmed: restoreConfig.overwriteConfirmed,
      });
      setRestorePreview(preview);
      toast({ title: "Sandbox preview ready", description: preview.summary });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Preview failed", description: error.message || "Unable to prepare sandbox preview." });
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup || !restorePreview) return;
    if (!restoreConfig.overwriteConfirmed) {
      toast({ variant: "destructive", title: "Overwrite confirmation required", description: "Generate a sandbox preview and confirm overwrite before restoring." });
      return;
    }

    try {
      await restoreBackup.mutateAsync(restorePreview);
      logBackupRestored(selectedBackup.name, selectedBackup.site_id);
      toast({
        title: "Restore complete",
        description: `${selectedBackup.name} restored via ${restoreConfig.mode.replaceAll("_", " ")} workflow.`,
      });
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
      setRestorePreview(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to restore backup." });
    }
  };

  const formatSize = (sizeMb: number) => sizeMb >= 1024 ? `${(sizeMb / 1024).toFixed(2)} GB` : `${sizeMb.toFixed(0)} MB`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const getExpiryStatus = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return { text: "Expired", color: "text-destructive" };
    if (daysLeft <= 7) return { text: `${daysLeft}d left`, color: "text-warning" };
    return { text: `${daysLeft}d left`, color: "text-muted-foreground" };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Backup Management</h2>
          <p className="text-muted-foreground">Plan verified backups, offsite replication, and restore sandbox previews before overwrite.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsScheduleDialogOpen(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-primary to-info hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Create Backup
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="glass-card rounded-xl p-4"><p className="text-sm text-muted-foreground">Total Backups</p><p className="text-2xl font-bold">{backups?.length || 0}</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold">{completedBackups}</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-sm text-muted-foreground">Checksum Verified</p><p className="text-2xl font-bold">{verifiedBackups}</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-sm text-muted-foreground">Protected Capacity</p><p className="text-2xl font-bold">{formatSize(totalBackupSize)}</p></div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card rounded-xl p-4 lg:col-span-2">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-success" />
            <div>
              <p className="font-semibold">Restore capabilities added</p>
              <p className="text-sm text-muted-foreground">Point-in-time, file-only, database-only, and partial restore targets now flow through a sandbox preview step before overwrite.</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-start gap-3">
            <UploadCloud className="mt-0.5 h-5 w-5 text-info" />
            <div>
              <p className="font-semibold">Offsite providers</p>
              <p className="text-sm text-muted-foreground">Amazon S3, Backblaze B2, Wasabi, and Google Cloud Storage are available for replica storage selection.</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="backups" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Archive className="mr-2 h-4 w-4" />Backups</TabsTrigger>
          <TabsTrigger value="schedules" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Calendar className="mr-2 h-4 w-4" />Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search backups, sites, or providers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border-border bg-secondary pl-10" />
            </div>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-full border-border bg-secondary sm:w-[220px]"><SelectValue placeholder="Filter by site" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites?.map((site) => <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>

          <div className="glass-card overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Backup</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Offsite</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Restore Scope</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" /></TableCell></TableRow>
                ) : filteredBackups?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center"><Archive className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" /><p className="text-muted-foreground">No backups found.</p></TableCell></TableRow>
                ) : filteredBackups?.map((backup) => {
                  const TypeIcon = backupTypeConfig[backup.backup_type].icon;
                  const StatusIcon = statusConfig[backup.status].icon;
                  const expiry = getExpiryStatus(backup.expires_at);
                  return (
                    <TableRow key={backup.id} className="border-border">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2"><TypeIcon className="h-4 w-4 text-primary" /><span className="font-medium">{backup.name}</span><Badge variant="outline" className={backupTypeConfig[backup.backup_type].color}>{backupTypeConfig[backup.backup_type].label}</Badge></div>
                          <p className="text-xs text-muted-foreground">{formatDate(backup.created_at)} • {formatSize(Number(backup.size_mb))} • <StatusIcon className="mr-1 inline h-3 w-3" />{statusConfig[backup.status].label}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{getSiteDomain(backup.site_id)}</TableCell>
                      <TableCell>
                        {backup.storage_provider ? (
                          <div className="space-y-1 text-sm">
                            <div className="font-medium">{providerConfig[backup.storage_provider].label}</div>
                            <div className="text-xs text-muted-foreground">{backup.storage_bucket || "bucket"}{backup.storage_region ? ` • ${backup.storage_region}` : ""}</div>
                          </div>
                        ) : <span className="text-muted-foreground">Local only</span>}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className={verificationConfig[backup.verification_status].color}>{verificationConfig[backup.verification_status].label}</Badge>
                          <p className="text-xs text-muted-foreground">{backup.checksum_sha256 ? `${backup.checksum_sha256.slice(0, 10)}…` : "No checksum"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{backup.contains_files ? "Files" : "No files"} • {backup.contains_database ? "Database" : "No database"}</p>
                          <p className="text-xs">PITR ref: {backup.point_in_time_reference ? formatDate(backup.point_in_time_reference) : "Not set"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{expiry ? <span className={expiry.color}>{expiry.text}</span> : <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" disabled={backup.status !== "completed"} title="Download backup"><Download className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-warning hover:bg-warning/10" disabled={backup.status !== "completed"} onClick={() => openRestoreDialog(backup)} title="Restore with preview"><RotateCcw className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { setSelectedBackup(backup); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">{activeSchedules} active schedules</div>
            <Button variant="outline" onClick={() => refetchSchedules()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          </div>
          <div className="glass-card overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Schedule</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Retention</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedulesLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" /></TableCell></TableRow>
                ) : schedules?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center"><Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" /><p className="text-muted-foreground">No schedules yet.</p></TableCell></TableRow>
                ) : schedules.map((schedule) => (
                  <TableRow key={schedule.id} className="border-border">
                    <TableCell><div className="flex items-center gap-3"><Settings2 className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{schedule.name}</p><p className="text-xs text-muted-foreground">{backupTypeConfig[schedule.backup_type].label}</p></div></div></TableCell>
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
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleToggleSchedule(schedule)}>{schedule.is_enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => { setSelectedSchedule(schedule); setDeleteScheduleDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="border-border bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
            <DialogDescription>Choose the payload, offsite target, and point-in-time reference for verification-aware backup creation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Site</Label><Select value={newBackup.siteId} onValueChange={(v) => setNewBackup((prev) => ({ ...prev, siteId: v }))}><SelectTrigger className="border-border bg-secondary"><SelectValue placeholder="Select a site" /></SelectTrigger><SelectContent>{sites?.map((site) => <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Backup Name</Label><Input value={newBackup.name} onChange={(e) => setNewBackup((prev) => ({ ...prev, name: e.target.value }))} className="border-border bg-secondary" placeholder="e.g. Pre-release PITR snapshot" /></div>
            <div className="space-y-2"><Label>Backup Type</Label><Select value={newBackup.type} onValueChange={(v) => setNewBackup((prev) => ({ ...prev, type: v as Backup["backup_type"] }))}><SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger><SelectContent>{(["full", "files", "database"] as Backup["backup_type"][]).map((type) => <SelectItem key={type} value={type}>{backupTypeConfig[type].label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Offsite Provider</Label><Select value={newBackup.provider} onValueChange={(v) => setNewBackup((prev) => ({ ...prev, provider: v as NonNullable<Backup["storage_provider"]> }))}><SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(providerConfig) as (keyof typeof providerConfig)[]).map((provider) => <SelectItem key={provider} value={provider}>{providerConfig[provider].label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Bucket / Container</Label><Input value={newBackup.bucket} onChange={(e) => setNewBackup((prev) => ({ ...prev, bucket: e.target.value }))} className="border-border bg-secondary" placeholder="backup bucket name" /></div>
            <div className="space-y-2"><Label>Region</Label><Input value={newBackup.region} onChange={(e) => setNewBackup((prev) => ({ ...prev, region: e.target.value }))} className="border-border bg-secondary" placeholder="us-east-1" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Point-in-time Reference</Label><Input type="datetime-local" value={newBackup.pointInTimeReference} onChange={(e) => setNewBackup((prev) => ({ ...prev, pointInTimeReference: e.target.value }))} className="border-border bg-secondary" /></div>
            <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Textarea value={newBackup.notes} onChange={(e) => setNewBackup((prev) => ({ ...prev, notes: e.target.value }))} className="border-border bg-secondary" rows={3} placeholder="Include release ID, retention intent, or partial restore notes." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createBackup.isPending} className="bg-gradient-to-r from-primary to-info">{createBackup.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Backup"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader><DialogTitle>Create Backup Schedule</DialogTitle><DialogDescription>Automate file, database, or full backups with retention policies.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Site</Label><Select value={newSchedule.siteId} onValueChange={(v) => setNewSchedule((prev) => ({ ...prev, siteId: v }))}><SelectTrigger className="border-border bg-secondary"><SelectValue placeholder="Select a site" /></SelectTrigger><SelectContent>{sites?.map((site) => <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Schedule Name</Label><Input value={newSchedule.name} onChange={(e) => setNewSchedule((prev) => ({ ...prev, name: e.target.value }))} className="border-border bg-secondary" /></div>
            <div className="space-y-2"><Label>Frequency</Label><Select value={newSchedule.frequency} onValueChange={(v) => setNewSchedule((prev) => ({ ...prev, frequency: v as BackupSchedule["frequency"] }))}><SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(frequencyConfig) as BackupSchedule["frequency"][]).map((freq) => <SelectItem key={freq} value={freq}>{frequencyConfig[freq].label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Backup Type</Label><Select value={newSchedule.backupType} onValueChange={(v) => setNewSchedule((prev) => ({ ...prev, backupType: v as BackupSchedule["backup_type"] }))}><SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger><SelectContent>{(["full", "files", "database"] as BackupSchedule["backup_type"][]).map((type) => <SelectItem key={type} value={type}>{backupTypeConfig[type].label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Retention (days)</Label><Select value={String(newSchedule.retentionDays)} onValueChange={(v) => setNewSchedule((prev) => ({ ...prev, retentionDays: Number(v) }))}><SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">7 days</SelectItem><SelectItem value="14">14 days</SelectItem><SelectItem value="30">30 days</SelectItem><SelectItem value="60">60 days</SelectItem><SelectItem value="90">90 days</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateSchedule} disabled={createSchedule.isPending}>{createSchedule.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Schedule"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="border-border bg-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Restore Backup</DialogTitle>
            <DialogDescription>Generate a sandbox preview before any overwrite. You can restore full, files-only, database-only, or partially to an alternate path/database.</DialogDescription>
          </DialogHeader>
          {selectedBackup && (
            <div className="space-y-4 py-2">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Backup</p><p className="font-medium">{selectedBackup.name}</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Checksum</p><p className="font-medium">{selectedBackup.checksum_sha256?.slice(0, 16) ?? "Unavailable"}</p></div>
                <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Provider</p><p className="font-medium">{selectedBackup.storage_provider ? providerConfig[selectedBackup.storage_provider].label : "Local only"}</p></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Restore Mode</Label><Select value={restoreConfig.mode} onValueChange={(v) => setRestoreConfig((prev) => ({ ...prev, mode: v as RestoreMode }))}><SelectTrigger className="border-border bg-secondary"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full">Full restore</SelectItem><SelectItem value="files_only">File-only restore</SelectItem><SelectItem value="database_only">DB-only restore</SelectItem><SelectItem value="partial">Partial restore</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Point-in-time Target</Label><Input type="datetime-local" value={restoreConfig.pointInTimeTarget} onChange={(e) => setRestoreConfig((prev) => ({ ...prev, pointInTimeTarget: e.target.value }))} className="border-border bg-secondary" /></div>
                <div className="space-y-2"><Label>Alternate Path (optional)</Label><Input value={restoreConfig.targetPath} onChange={(e) => setRestoreConfig((prev) => ({ ...prev, targetPath: e.target.value }))} className="border-border bg-secondary" placeholder="/var/www/example.com/restore-sandbox" /></div>
                <div className="space-y-2"><Label>Alternate Database (optional)</Label><Input value={restoreConfig.targetDatabase} onChange={(e) => setRestoreConfig((prev) => ({ ...prev, targetDatabase: e.target.value }))} className="border-border bg-secondary" placeholder="site_restore_preview" /></div>
              </div>
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-warning-foreground">Sandbox preview before overwrite</p>
                    <p className="text-sm text-muted-foreground">Run preview first to inspect affected files/tables and confirm overwrite risk.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={restoreConfig.overwriteConfirmed} onCheckedChange={(checked) => setRestoreConfig((prev) => ({ ...prev, overwriteConfirmed: checked }))} />
                    <span className="text-sm">Approve overwrite</span>
                  </div>
                </div>
              </div>
              {restorePreview && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Destination</p><p className="font-medium">{restorePreview.manifest.destination}</p></div>
                  <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Files affected</p><p className="font-medium">{restorePreview.manifest.filesAffected}</p></div>
                  <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Tables affected</p><p className="font-medium">{restorePreview.manifest.tablesAffected}</p></div>
                  <div className="rounded-lg border border-border p-3 md:col-span-3">
                    <p className="text-xs text-muted-foreground">Sandbox checks</p>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{restorePreview.manifest.checks.map((check) => <li key={check}>• {check}</li>)}</ul>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handlePreviewRestore} disabled={restorePreviewMutation.isPending}>{restorePreviewMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Previewing...</> : "Run Sandbox Preview"}</Button>
            <Button onClick={handleRestore} disabled={!restorePreview || restoreBackup.isPending} className="bg-warning text-warning-foreground hover:bg-warning/90">{restoreBackup.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Restoring...</> : "Restore Backup"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader><AlertDialogTitle>Delete Backup</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete "{selectedBackup?.name}"? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-border">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete Backup</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteScheduleDialogOpen} onOpenChange={setDeleteScheduleDialogOpen}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader><AlertDialogTitle>Delete Schedule</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the schedule "{selectedSchedule?.name}"? Existing backups will not be deleted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-border">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteSchedule} className="bg-destructive hover:bg-destructive/90">Delete Schedule</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
