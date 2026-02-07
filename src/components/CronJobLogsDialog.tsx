import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  Trash2,
  History,
} from "lucide-react";
import { useCronJobLogs, useClearCronJobLogs } from "@/hooks/useCronJobLogs";
import { format, formatDistanceToNow } from "date-fns";
import type { CronJob } from "@/hooks/useCronJobs";

interface CronJobLogsDialogProps {
  job: CronJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CronJobLogsDialog = ({ job, open, onOpenChange }: CronJobLogsDialogProps) => {
  const { data: logs, isLoading } = useCronJobLogs(job?.id);
  const clearLogs = useClearCronJobLogs();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "running":
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Execution History
          </DialogTitle>
          <DialogDescription>
            {job ? `Showing execution logs for "${job.name}"` : "Loading..."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            {logs?.length || 0} executions recorded
          </p>
          {logs && logs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearLogs.mutate(job?.id)}
              disabled={clearLogs.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Logs
            </Button>
          )}
        </div>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <Collapsible
                    key={log.id}
                    open={expandedLog === log.id}
                    onOpenChange={(open) => setExpandedLog(open ? log.id : null)}
                    asChild
                  >
                    <>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {expandedLog === log.id ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(new Date(log.started_at), "MMM d, yyyy HH:mm:ss")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {formatDuration(log.execution_time_ms)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={4} className="bg-muted/30 p-0">
                            <div className="p-4 space-y-3">
                              {log.output && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Output:</p>
                                  <pre className="text-xs bg-background p-3 rounded border overflow-x-auto whitespace-pre-wrap font-mono">
                                    {log.output}
                                  </pre>
                                </div>
                              )}
                              {log.error_message && (
                                <div>
                                  <p className="text-xs font-medium text-destructive mb-1">Error:</p>
                                  <pre className="text-xs bg-destructive/10 text-destructive p-3 rounded border border-destructive/20 overflow-x-auto whitespace-pre-wrap font-mono">
                                    {log.error_message}
                                  </pre>
                                </div>
                              )}
                              {!log.output && !log.error_message && (
                                <p className="text-sm text-muted-foreground italic">No output recorded</p>
                              )}
                              {log.completed_at && (
                                <p className="text-xs text-muted-foreground">
                                  Completed: {format(new Date(log.completed_at), "MMM d, yyyy HH:mm:ss")}
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <History className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No execution history yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run the job to see execution logs here
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
