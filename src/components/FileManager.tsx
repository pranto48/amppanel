import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Download,
  Edit,
  FileCog,
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileText,
  Folder,
  FolderPlus,
  GitBranch,
  Home,
  MoreVertical,
  Search,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSites } from "@/hooks/useSites";
import { useFileManager, type FileItem } from "@/hooks/useFileManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CodeEditor } from "./CodeEditor";

const getFileIcon = (name: string, type: "file" | "folder") => {
  if (type === "folder") return Folder;
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js": case "ts": case "jsx": case "tsx": case "php": case "py": case "rb": case "go":
      return FileCode;
    case "html": case "css": case "scss": case "json": case "xml": case "md": case "txt": case "log":
      return FileText;
    case "png": case "jpg": case "jpeg": case "gif": case "svg": case "webp":
      return FileImage;
    case "zip": case "tar": case "gz": case "tgz":
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
  const ext = name.split(".").pop()?.toLowerCase();
  return !!ext && ["txt", "html", "css", "js", "ts", "jsx", "tsx", "json", "xml", "md", "php", "py", "rb", "go", "java", "c", "cpp", "h", "sh", "yml", "yaml", "toml", "ini", "conf", "htaccess", "env", "log"].includes(ext);
};

export const FileManager = () => {
  const { data: sites } = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [archiveForm, setArchiveForm] = useState({ archivePath: "", destinationPath: "/public/extracted", archiveType: "zip" as "zip" | "tar" | "unzip", publishDomain: "" });
  const [gitForm, setGitForm] = useState({ repositoryUrl: "", branch: "main", targetPath: "/public" });
  const [permissionForm, setPermissionForm] = useState({ targetPath: "/public", mode: "755", owner: "www-data", group: "www-data" });

  const {
    files,
    loading,
    currentPath,
    operationRuns,
    versionHistory,
    malwareScans,
    listFiles,
    uploadFile,
    deleteFile,
    downloadFile,
    getFileContent,
    saveFileContent,
    createFolder,
    extractArchive,
    publishExtractedArchiveAsSite,
    runGitOperation,
    setPermissions,
    fixOwnership,
    scanForMalware,
  } = useFileManager(selectedSiteId);

  useEffect(() => {
    if (sites?.length && !selectedSiteId) setSelectedSiteId(sites[0].id);
  }, [sites, selectedSiteId]);

  useEffect(() => {
    if (selectedSiteId) listFiles("/");
  }, [selectedSiteId, listFiles]);

  const handleFileUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    for (let i = 0; i < fileList.length; i += 1) await uploadFile(fileList[i], currentPath);
  }, [uploadFile, currentPath]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleItemClick = (item: FileItem) => {
    if (item.type === "folder") listFiles(item.path);
    else if (isTextFile(item.name)) setEditingFile(item);
  };

  const breadcrumbs = useMemo(() => currentPath.split("/").filter(Boolean), [currentPath]);
  const selectedSite = sites?.find((site) => site.id === selectedSiteId);
  const quickFolders = useMemo(() => {
    const base = ["/", "/public", "/public_html", "/uploads", "/logs", "/tmp"];
    const dynamic = files.filter((file) => file.type === "folder").map((file) => file.path);
    return [...new Set([...base, ...dynamic])].slice(0, 14);
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm.trim()) return files;
    const q = searchTerm.trim().toLowerCase();
    return files.filter((file) => file.name.toLowerCase().includes(q));
  }, [files, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">File Manager</h2>
          <p className="text-muted-foreground">Manage files, archives, git sync, permissions, malware scans, and publish extracted content as a new site.</p>
        </div>
        <Select value={selectedSiteId || ""} onValueChange={setSelectedSiteId}>
          <SelectTrigger className="w-56 bg-secondary border-border"><SelectValue placeholder="Select a site" /></SelectTrigger>
          <SelectContent>{sites?.map((site) => <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {!selectedSiteId ? (
        <div className="glass-card rounded-xl p-12 text-center"><Folder className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><p className="text-muted-foreground">Select a site to manage its files.</p></div>
      ) : (
        <>
          <div className="glass-card rounded-xl p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setNewFolderDialogOpen(true)}><FolderPlus className="mr-2 h-4 w-4" />Folder</Button>
              <label>
                <Button variant="outline" size="sm" asChild><span className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Upload</span></Button>
                <input type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />
              </label>
              <Button variant="outline" size="sm" onClick={() => listFiles(currentPath)}><RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />Reload</Button>
              <Button variant="outline" size="sm" onClick={() => extractArchive(archiveForm.archivePath, archiveForm.destinationPath, archiveForm.archiveType)}><FileArchive className="mr-2 h-4 w-4" />Extract</Button>
              <Button variant="outline" size="sm" onClick={() => runGitOperation("git_pull", gitForm.repositoryUrl, gitForm.targetPath, gitForm.branch)}><GitBranch className="mr-2 h-4 w-4" />Git Pull</Button>
              <Button variant="outline" size="sm" onClick={() => setPermissions(permissionForm.targetPath, permissionForm.mode)}><Wrench className="mr-2 h-4 w-4" />CHMOD</Button>
              <Button variant="outline" size="sm" onClick={() => scanForMalware(currentPath)}><ShieldAlert className="mr-2 h-4 w-4" />Scan</Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/30 px-2 py-1">
                  <button onClick={() => listFiles("/")} className="rounded-lg p-2 hover:bg-muted"><Home className="h-4 w-4 text-muted-foreground" /></button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedSite?.domain}</span>
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb + index} className="flex items-center gap-1">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <button onClick={() => listFiles(`/${breadcrumbs.slice(0, index + 1).join("/")}`)} className="text-sm hover:text-primary">{crumb}</button>
                    </div>
                  ))}
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search current folder..." className="pl-9" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            <div className="glass-card rounded-xl p-4 xl:col-span-1">
              <div className="mb-3 flex items-center gap-2 font-medium"><Folder className="h-4 w-4 text-warning" />Folders</div>
              <div className="space-y-1">
                {quickFolders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => listFiles(folder)}
                    className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary/60", folder === currentPath && "bg-primary/10 text-primary")}
                  >
                    <Folder className="h-4 w-4" />
                    <span className="truncate">{folder === "/" ? "home" : folder}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={cn("glass-card rounded-xl overflow-hidden transition-all xl:col-span-2", dragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background")} onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}>
              {loading ? (
                <div className="p-12 text-center"><div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /><p className="text-muted-foreground">Loading files...</p></div>
              ) : filteredFiles.length ? (
                <div>
                  <div className="grid grid-cols-12 border-b border-border bg-secondary/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-1 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-border">
                  {currentPath !== "/" && (
                    <button onClick={() => listFiles("/" + breadcrumbs.slice(0, -1).join("/") || "/")} className="flex w-full items-center gap-4 p-4 text-left hover:bg-muted/30"><Folder className="h-5 w-5 text-muted-foreground" /><span className="text-muted-foreground">..</span></button>
                  )}
                  {filteredFiles.map((item) => {
                    const FileIcon = getFileIcon(item.name, item.type);
                    return (
                      <div key={item.id} className="group grid grid-cols-12 items-center gap-2 px-4 py-3 hover:bg-muted/30">
                        <button onClick={() => handleItemClick(item)} className="col-span-6 flex min-w-0 items-center gap-3 text-left">
                          <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", item.type === "folder" ? "bg-warning/10" : "bg-primary/10")}><FileIcon className={cn("h-4 w-4", item.type === "folder" ? "text-warning" : "text-primary")} /></div>
                          <div className="min-w-0"><p className="truncate font-medium">{item.name}</p></div>
                        </button>
                        <div className="col-span-2 text-sm text-muted-foreground">{item.type === "folder" ? "-" : formatFileSize(item.size)}</div>
                        <div className="col-span-2 text-sm text-muted-foreground">{item.type === "folder" ? "Directory" : item.mimeType || "File"}</div>
                        <div className="col-span-1 flex justify-end items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {item.type === "file" && isTextFile(item.name) && <Button variant="ghost" size="icon" onClick={() => setEditingFile(item)}><Edit className="h-4 w-4" /></Button>}
                          {item.type === "file" && <Button variant="ghost" size="icon" onClick={() => downloadFile(item.path, item.name)}><Download className="h-4 w-4" /></Button>}
                          {item.type === "file" && <Button variant="ghost" size="icon" onClick={() => scanForMalware(item.path)}><FileCog className="h-4 w-4" /></Button>}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {item.type === "file" && isTextFile(item.name) && <DropdownMenuItem onClick={() => setEditingFile(item)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>}
                              {item.type === "file" && <DropdownMenuItem onClick={() => downloadFile(item.path, item.name)}><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>}
                              {item.type === "file" && <DropdownMenuItem onClick={() => scanForMalware(item.path)}><ShieldAlert className="mr-2 h-4 w-4" />Malware Scan</DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => deleteFile(item.path)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              ) : (
                <div className="p-12 text-center"><Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><p className="text-muted-foreground">{searchTerm ? "No files match this search in the current folder." : "No files yet. Upload, extract an archive, or clone a repository."}</p></div>
              )}
            </div>

            <div className="space-y-4 xl:col-span-1">
              <div className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium"><FileArchive className="h-4 w-4 text-primary" />Archive extraction & publish</div>
                <div className="space-y-2"><Label>Archive path</Label><Input value={archiveForm.archivePath} onChange={(e) => setArchiveForm((v) => ({ ...v, archivePath: e.target.value }))} placeholder="/uploads/site.zip" /></div>
                <div className="space-y-2"><Label>Destination</Label><Input value={archiveForm.destinationPath} onChange={(e) => setArchiveForm((v) => ({ ...v, destinationPath: e.target.value }))} placeholder="/public/extracted" /></div>
                <div className="space-y-2"><Label>Type</Label><Select value={archiveForm.archiveType} onValueChange={(v) => setArchiveForm((prev) => ({ ...prev, archiveType: v as "zip" | "tar" | "unzip" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="zip">zip</SelectItem><SelectItem value="unzip">unzip</SelectItem><SelectItem value="tar">tar</SelectItem></SelectContent></Select></div>
                <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => extractArchive(archiveForm.archivePath, archiveForm.destinationPath, archiveForm.archiveType)}>Extract</Button><Button className="flex-1" onClick={() => publishExtractedArchiveAsSite(archiveForm.destinationPath, archiveForm.publishDomain)} disabled={!archiveForm.publishDomain}>Publish as Site</Button></div>
                <Input value={archiveForm.publishDomain} onChange={(e) => setArchiveForm((v) => ({ ...v, publishDomain: e.target.value }))} placeholder="newsite.example.com" />
              </div>

              <div className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium"><GitBranch className="h-4 w-4 text-info" />Git clone / pull in site root</div>
                <Input value={gitForm.repositoryUrl} onChange={(e) => setGitForm((v) => ({ ...v, repositoryUrl: e.target.value }))} placeholder="https://github.com/org/repo.git" />
                <div className="grid grid-cols-2 gap-2"><Input value={gitForm.branch} onChange={(e) => setGitForm((v) => ({ ...v, branch: e.target.value }))} placeholder="main" /><Input value={gitForm.targetPath} onChange={(e) => setGitForm((v) => ({ ...v, targetPath: e.target.value }))} placeholder="/public" /></div>
                <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => runGitOperation("git_clone", gitForm.repositoryUrl, gitForm.targetPath, gitForm.branch)}>Clone</Button><Button className="flex-1" onClick={() => runGitOperation("git_pull", gitForm.repositoryUrl, gitForm.targetPath, gitForm.branch)}>Pull</Button></div>
              </div>

              <div className="glass-card rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium"><Wrench className="h-4 w-4 text-warning" />Permissions & ownership</div>
                <Input value={permissionForm.targetPath} onChange={(e) => setPermissionForm((v) => ({ ...v, targetPath: e.target.value }))} placeholder="/public/uploads" />
                <div className="grid grid-cols-3 gap-2"><Input value={permissionForm.mode} onChange={(e) => setPermissionForm((v) => ({ ...v, mode: e.target.value }))} placeholder="755" /><Input value={permissionForm.owner} onChange={(e) => setPermissionForm((v) => ({ ...v, owner: e.target.value }))} placeholder="www-data" /><Input value={permissionForm.group} onChange={(e) => setPermissionForm((v) => ({ ...v, group: e.target.value }))} placeholder="www-data" /></div>
                <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setPermissions(permissionForm.targetPath, permissionForm.mode)}>Set Permissions</Button><Button className="flex-1" onClick={() => fixOwnership(permissionForm.targetPath, permissionForm.owner, permissionForm.group)}>Fix Ownership</Button></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="glass-card rounded-xl p-4 xl:col-span-1">
              <div className="mb-3 flex items-center gap-2 font-medium"><Sparkles className="h-4 w-4 text-primary" />File diff / version history</div>
              <div className="space-y-3">
                {versionHistory.length ? versionHistory.map((version) => (
                  <div key={version.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium truncate">{version.file_path}</p>
                    <p className="text-xs text-muted-foreground">v{version.version_number} • {version.change_type}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{version.diff_summary || "No diff summary."}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Edits and uploads will appear here with diff summaries.</p>}
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 xl:col-span-1">
              <div className="mb-3 flex items-center gap-2 font-medium"><ShieldAlert className="h-4 w-4 text-warning" />Malware scans for uploaded files</div>
              <div className="space-y-3">
                {malwareScans.length ? malwareScans.map((scan) => (
                  <div key={scan.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2"><p className="font-medium truncate">{scan.file_path}</p><Badge variant="outline" className={scan.status === "clean" ? "bg-success/20 text-success border-success/30" : scan.status === "warning" ? "bg-warning/20 text-warning border-warning/30" : "bg-destructive/20 text-destructive border-destructive/30"}>{scan.status}</Badge></div>
                    <p className="mt-1 text-xs text-muted-foreground">{scan.scan_summary || "No summary available."}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Uploaded files will be scanned and recorded here.</p>}
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 xl:col-span-1">
              <div className="mb-3 flex items-center gap-2 font-medium"><GitBranch className="h-4 w-4 text-info" />File operations history</div>
              <div className="space-y-3">
                {operationRuns.length ? operationRuns.map((run) => (
                  <div key={run.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2"><p className="font-medium">{run.operation.replaceAll("_", " ")}</p><Badge variant="outline">{run.status}</Badge></div>
                    <p className="mt-1 text-xs text-muted-foreground">{run.output || run.target_path || run.source_path || "No output."}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">Archive, git, permission, and ownership actions will be tracked here.</p>}
              </div>
            </div>
          </div>
        </>
      )}

      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="bg-card border-border"><DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader><div className="space-y-4 py-4"><Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" onKeyDown={(e) => e.key === "Enter" && createFolder(newFolderName, currentPath)} /><Button onClick={async () => { await createFolder(newFolderName.trim(), currentPath); setNewFolderName(""); setNewFolderDialogOpen(false); }} disabled={!newFolderName.trim()}>Create Folder</Button></div></DialogContent>
      </Dialog>

      {editingFile && (
        <CodeEditor file={editingFile} open={!!editingFile} onOpenChange={(open) => !open && setEditingFile(null)} onGetContent={getFileContent} onSaveContent={saveFileContent} />
      )}
    </div>
  );
};
