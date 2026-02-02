import { useState } from "react";
import { Database, Plus, Search, Trash2, ExternalLink, RefreshCw, Info, SquareArrowOutUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useDatabases, useDeleteDatabase } from "@/hooks/useDatabases";
import { useSites } from "@/hooks/useSites";
import { AddDatabaseDialog } from "@/components/AddDatabaseDialog";
import { DatabaseConnectionModal } from "@/components/DatabaseConnectionModal";
import { useToast } from "@/hooks/use-toast";
import { useLogActivity } from "@/hooks/useActivityLogs";
import type { Tables } from "@/integrations/supabase/types";

type DatabaseType = Tables<"databases">;

export const DatabasesManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType | null>(null);

  const { data: databases, isLoading, refetch } = useDatabases();
  const { data: sites } = useSites();
  const deleteDatabase = useDeleteDatabase();
  const { toast } = useToast();
  const { logDatabaseDeleted } = useLogActivity();

  const getSiteDomain = (siteId: string) => {
    const site = sites?.find((s) => s.id === siteId);
    return site?.domain || "Unknown";
  };

  const getDbTypeBadgeColor = (dbType: string) => {
    switch (dbType) {
      case "mysql":
        return "bg-info/20 text-info border-info/30";
      case "postgresql":
        return "bg-primary/20 text-primary border-primary/30";
      case "mariadb":
        return "bg-warning/20 text-warning border-warning/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredDatabases = databases?.filter(
    (db) =>
      db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      db.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSiteDomain(db.site_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!selectedDatabase) return;

    try {
      await deleteDatabase.mutateAsync(selectedDatabase.id);
      
      // Log activity
      logDatabaseDeleted(selectedDatabase.name, selectedDatabase.site_id);
      
      toast({
        title: "Database deleted",
        description: `Database "${selectedDatabase.name}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete database.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedDatabase(null);
    }
  };

  const formatSize = (sizeMb: number) => {
    if (sizeMb >= 1024) {
      return `${(sizeMb / 1024).toFixed(2)} GB`;
    }
    return `${sizeMb} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Databases</h2>
          <p className="text-muted-foreground">
            Manage MySQL, PostgreSQL, and MariaDB databases for your sites
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-primary to-info hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Database
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {databases?.filter((d) => d.db_type === "mysql").length || 0}
              </p>
              <p className="text-sm text-muted-foreground">MySQL</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {databases?.filter((d) => d.db_type === "postgresql").length || 0}
              </p>
              <p className="text-sm text-muted-foreground">PostgreSQL</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {databases?.filter((d) => d.db_type === "mariadb").length || 0}
              </p>
              <p className="text-sm text-muted-foreground">MariaDB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search databases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Databases Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Database</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Site</TableHead>
              <TableHead className="text-muted-foreground">Username</TableHead>
              <TableHead className="text-muted-foreground">Size</TableHead>
              <TableHead className="text-muted-foreground">Charset</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-muted-foreground">Loading databases...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDatabases?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Database className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No databases found matching your search" : "No databases yet"}
                  </p>
                  {!searchQuery && (
                    <Button
                      variant="link"
                      onClick={() => setIsAddDialogOpen(true)}
                      className="mt-2"
                    >
                      Create your first database
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredDatabases?.map((db) => (
                <TableRow key={db.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Database className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{db.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getDbTypeBadgeColor(db.db_type)}
                    >
                      {db.db_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">{getSiteDomain(db.site_id)}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{db.username}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatSize(db.size_mb)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {db.db_charset || "utf8mb4"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => {
                          const siteDomain = getSiteDomain(db.site_id);
                          const adminUrl = db.db_type === "postgresql" 
                            ? `https://pgadmin.${siteDomain}` 
                            : `https://phpmyadmin.${siteDomain}`;
                          window.open(adminUrl, "_blank");
                        }}
                        title={db.db_type === "postgresql" ? "Open pgAdmin" : "Open phpMyAdmin"}
                      >
                        <SquareArrowOutUpRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => {
                          setSelectedDatabase(db);
                          setConnectionModalOpen(true);
                        }}
                        title="Connection Info"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedDatabase(db);
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

      {/* Add Database Dialog */}
      <AddDatabaseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      {/* Connection Info Modal */}
      <DatabaseConnectionModal
        open={connectionModalOpen}
        onOpenChange={setConnectionModalOpen}
        database={selectedDatabase}
        siteDomain={selectedDatabase ? getSiteDomain(selectedDatabase.site_id) : ""}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Database</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the database "{selectedDatabase?.name}"? 
              This action cannot be undone and all data will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
