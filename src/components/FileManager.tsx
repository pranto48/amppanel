import { useState, useEffect, useCallback } from "react";
import { 
  File, 
  Folder, 
  Upload, 
  Download, 
  Trash2, 
  Plus,
  ChevronRight,
  Home,
  RefreshCw,
  FileCode,
  FileText,
  FileImage,
  FileArchive,
  MoreVertical,
  Edit,
  FolderPlus,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSites } from "@/hooks/useSites";
import { useFileManager, FileItem } from "@/hooks/useFileManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CodeEditor } from "./CodeEditor";

const getFileIcon = (name: string, type: "file" | "folder") => {
  if (type === "folder") return Folder;
  
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
    case "php":
    case "py":
    case "rb":
    case "go":
      return FileCode;
    case "html":
    case "css":
    case "scss":
    case "json":
    case "xml":
    case "md":
    case "txt":
      return FileText;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
      return FileImage;
    case "zip":
    case "tar":
    case "gz":
    case "rar":
      return FileArchive;
    default:
      return File;
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isTextFile = (name: string) => {
  const textExtensions = ["txt", "html", "css", "js", "ts", "jsx", "tsx", "json", "xml", "md", "php", "py", "rb", "go", "java", "c", "cpp", "h", "sh", "yml", "yaml", "toml", "ini", "conf", "htaccess", "env"];
  const ext = name.split(".").pop()?.toLowerCase();
  return ext && textExtensions.includes(ext);
};

export const FileManager = () => {
  const { data: sites } = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  
  const {
    files,
    loading,
    currentPath,
    listFiles,
    uploadFile,
    deleteFile,
    downloadFile,
    getFileContent,
    saveFileContent,
    createFolder,
  } = useFileManager(selectedSiteId);

  useEffect(() => {
    if (sites && sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  useEffect(() => {
    if (selectedSiteId) {
      listFiles("/");
    }
  }, [selectedSiteId, listFiles]);

  const handleFileUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    
    for (let i = 0; i < fileList.length; i++) {
      await uploadFile(fileList[i], currentPath);
    }
  }, [uploadFile, currentPath]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleItemClick = (item: FileItem) => {
    if (item.type === "folder") {
      listFiles(item.path);
    } else if (isTextFile(item.name)) {
      setEditingFile(item);
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim(), currentPath);
      setNewFolderName("");
      setNewFolderDialogOpen(false);
    }
  };

  const navigateTo = (path: string) => {
    listFiles(path);
  };

  const breadcrumbs = currentPath.split("/").filter(Boolean);

  const selectedSite = sites?.find(s => s.id === selectedSiteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">File Manager</h2>
          <p className="text-muted-foreground">Browse and manage your site files</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSiteId || ""} onValueChange={setSelectedSiteId}>
            <SelectTrigger className="w-48 bg-secondary border-border">
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
      </div>

      {!selectedSiteId ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Site Selected</h3>
          <p className="text-muted-foreground">Select a site to manage its files</p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1 flex-1 overflow-x-auto">
                <button
                  onClick={() => navigateTo("/")}
                  className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0"
                >
                  <Home className="w-4 h-4 text-muted-foreground" />
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground shrink-0">{selectedSite?.domain}</span>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-1 shrink-0">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <button
                      onClick={() => navigateTo("/" + breadcrumbs.slice(0, index + 1).join("/"))}
                      className="text-sm text-foreground hover:text-primary transition-colors"
                    >
                      {crumb}
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewFolderDialogOpen(true)}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
                <label>
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </span>
                  </Button>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </label>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => listFiles(currentPath)}
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </div>

          {/* File List */}
          <div
            className={cn(
              "glass-card rounded-xl overflow-hidden transition-all",
              dragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading files...</p>
              </div>
            ) : files.length > 0 ? (
              <div className="divide-y divide-border">
                {/* Parent folder navigation */}
                {currentPath !== "/" && (
                  <button
                    onClick={() => {
                      const parentPath = "/" + breadcrumbs.slice(0, -1).join("/");
                      navigateTo(parentPath || "/");
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Folder className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground">..</span>
                  </button>
                )}

                {/* Files and folders */}
                {files.map((item) => {
                  const FileIcon = getFileIcon(item.name, item.type);
                  const canEdit = item.type === "file" && isTextFile(item.name);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors group"
                    >
                      <button
                        onClick={() => handleItemClick(item)}
                        className="flex items-center gap-4 flex-1 min-w-0 text-left"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          item.type === "folder" ? "bg-warning/10" : "bg-primary/10"
                        )}>
                          <FileIcon className={cn(
                            "w-5 h-5",
                            item.type === "folder" ? "text-warning" : "text-primary"
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.type === "folder" ? "Folder" : formatFileSize(item.size)}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingFile(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {item.type === "file" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadFile(item.path, item.name)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <DropdownMenuItem onClick={() => setEditingFile(item)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {item.type === "file" && (
                              <DropdownMenuItem onClick={() => downloadFile(item.path, item.name)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => deleteFile(item.path)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No files yet</h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop files here or click Upload
                </p>
                <label>
                  <Button className="bg-primary text-primary-foreground" asChild>
                    <span className="cursor-pointer">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Files
                    </span>
                  </Button>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </label>
              </div>
            )}
          </div>
        </>
      )}

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-primary" />
              Create New Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-secondary border-border"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setNewFolderDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                className="flex-1 bg-primary text-primary-foreground"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Code Editor Dialog */}
      {editingFile && (
        <CodeEditor
          file={editingFile}
          open={!!editingFile}
          onOpenChange={(open) => !open && setEditingFile(null)}
          onGetContent={getFileContent}
          onSaveContent={saveFileContent}
        />
      )}
    </div>
  );
};
