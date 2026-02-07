import { useState } from "react";
import { 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  RotateCw,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Terminal,
  Archive,
  Trash,
  Wrench,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCronJobs, useCreateCronJob, useUpdateCronJob, useDeleteCronJob, useRunCronJob, type CronJob, type CronJobType } from "@/hooks/useCronJobs";
import { useSites } from "@/hooks/useSites";
import { formatDistanceToNow } from "date-fns";
import { CronJobLogsDialog } from "@/components/CronJobLogsDialog";

interface CronJobFormData {
  name: string;
  description: string;
  schedule: string;
  command: string;
  job_type: CronJobType;
  is_enabled: boolean;
  site_id: string | undefined;
}

const SCHEDULE_PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Daily at 2 AM", value: "0 2 * * *" },
  { label: "Weekly (Sunday)", value: "0 0 * * 0" },
  { label: "Monthly (1st)", value: "0 0 1 * *" },
];

const JOB_TYPES = [
  { value: "backup", label: "Backup", icon: Archive, color: "primary" },
  { value: "cleanup", label: "Cleanup", icon: Trash, color: "warning" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "info" },
  { value: "custom", label: "Custom", icon: Terminal, color: "secondary" },
];

export const CronJobsManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [logsJob, setLogsJob] = useState<CronJob | null>(null);
  
  const [formData, setFormData] = useState<CronJobFormData>({
    name: "",
    description: "",
    schedule: "0 2 * * *",
    command: "",
    job_type: "backup",
    is_enabled: true,
    site_id: undefined,
  });

  const { data: cronJobs, isLoading } = useCronJobs();
  const { data: sites } = useSites();
  const createJob = useCreateCronJob();
  const updateJob = useUpdateCronJob();
  const deleteJob = useDeleteCronJob();
  const runJob = useRunCronJob();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      schedule: "0 2 * * *",
      command: "",
      job_type: "backup",
      is_enabled: true,
      site_id: undefined,
    });
    setSelectedPreset("");
  };

  const handleCreateJob = async () => {
    await createJob.mutateAsync(formData);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;
    await updateJob.mutateAsync({ id: editingJob.id, ...formData });
    setEditingJob(null);
    resetForm();
  };

  const handleDeleteJob = async () => {
    if (!deleteJobId) return;
    await deleteJob.mutateAsync(deleteJobId);
    setDeleteJobId(null);
  };

  const handleToggleEnabled = async (job: CronJob) => {
    await updateJob.mutateAsync({ id: job.id, is_enabled: !job.is_enabled });
  };

  const handleRunNow = async (jobId: string) => {
    await runJob.mutateAsync(jobId);
  };

  const openEditDialog = (job: CronJob) => {
    setFormData({
      name: job.name,
      description: job.description || "",
      schedule: job.schedule,
      command: job.command,
      job_type: job.job_type,
      is_enabled: job.is_enabled,
      site_id: job.site_id || undefined,
    });
    setEditingJob(job);
  };

  const getJobTypeInfo = (type: string) => {
    return JOB_TYPES.find(t => t.value === type) || JOB_TYPES[3];
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "running":
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Running</Badge>;
      default:
        return <Badge variant="outline">Never run</Badge>;
    }
  };

  const JobFormDialog = ({ isEdit = false }: { isEdit?: boolean }) => (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Cron Job" : "Create New Cron Job"}</DialogTitle>
        <DialogDescription>
          Schedule automated tasks for backups, cleanups, and maintenance.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Job Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Daily Database Backup"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Backs up all databases to the backup server"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="job_type">Job Type</Label>
            <Select
              value={formData.job_type}
              onValueChange={(value) => setFormData({ ...formData, job_type: value as CronJobType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site">Site (Optional)</Label>
            <Select
              value={formData.site_id || "all"}
              onValueChange={(value) => setFormData({ ...formData, site_id: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All sites" />
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
        </div>

        <div className="space-y-2">
          <Label>Schedule Preset</Label>
          <Select
            value={selectedPreset}
            onValueChange={(value) => {
              setSelectedPreset(value);
              setFormData({ ...formData, schedule: value });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a preset..." />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULE_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule">Cron Expression</Label>
          <Input
            id="schedule"
            value={formData.schedule}
            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
            placeholder="0 2 * * *"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Format: minute hour day month weekday (e.g., "0 2 * * *" = daily at 2 AM)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="command">Command</Label>
          <Textarea
            id="command"
            value={formData.command}
            onChange={(e) => setFormData({ ...formData, command: e.target.value })}
            placeholder="/usr/bin/pg_dump -U postgres mydb > /backups/db.sql"
            className="font-mono text-sm"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="is_enabled">Enable Job</Label>
          <Switch
            id="is_enabled"
            checked={formData.is_enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => isEdit ? setEditingJob(null) : setIsCreateDialogOpen(false)}>
          Cancel
        </Button>
        <Button 
          onClick={isEdit ? handleUpdateJob : handleCreateJob}
          disabled={!formData.name || !formData.schedule || !formData.command}
        >
          {isEdit ? "Save Changes" : "Create Job"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cron Jobs</h2>
          <p className="text-muted-foreground">Schedule automated tasks for backups, cleanups, and maintenance</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Cron Job
            </Button>
          </DialogTrigger>
          <JobFormDialog />
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cronJobs?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-success/10">
                <Play className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cronJobs?.filter(j => j.is_enabled).length || 0}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-warning/10">
                <Pause className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cronJobs?.filter(j => !j.is_enabled).length || 0}</p>
                <p className="text-sm text-muted-foreground">Paused</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cronJobs?.filter(j => j.last_status === "failed").length || 0}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Tasks</CardTitle>
          <CardDescription>Manage your automated cron jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {cronJobs && cronJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cronJobs.map((job) => {
                  const typeInfo = getJobTypeInfo(job.job_type);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${typeInfo.color}/10`}>
                            <TypeIcon className={`w-4 h-4 text-${typeInfo.color}`} />
                          </div>
                          <div>
                            <p className="font-medium">{job.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {job.description || job.command}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{job.schedule}</code>
                      </TableCell>
                      <TableCell>
                        {job.last_run_at ? (
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(job.last_run_at), { addSuffix: true })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(job.last_status)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={job.is_enabled}
                          onCheckedChange={() => handleToggleEnabled(job)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRunNow(job.id)}
                            disabled={runJob.isPending}
                            title="Run now"
                          >
                            <RotateCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLogsJob(job)}
                            title="View execution history"
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(job)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteJobId(job.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Cron Jobs</h3>
              <p className="text-muted-foreground mb-4">
                Create your first scheduled task to automate backups, cleanups, and more.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Cron Job
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
        <JobFormDialog isEdit />
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cron Job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scheduled task. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJob} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logs Dialog */}
      <CronJobLogsDialog
        job={logsJob}
        open={!!logsJob}
        onOpenChange={(open) => !open && setLogsJob(null)}
      />
    </div>
  );
};
