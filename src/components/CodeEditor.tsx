import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Save, 
  X, 
  FileCode, 
  Loader2,
  Undo,
  Redo,
  Copy,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileItem } from "@/hooks/useFileManager";

interface CodeEditorProps {
  file: FileItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetContent: (path: string) => Promise<string | null>;
  onSaveContent: (path: string, content: string) => Promise<boolean>;
}

const getLanguage = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    xml: "xml",
    md: "markdown",
    php: "php",
    py: "python",
    rb: "ruby",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    sh: "bash",
    yml: "yaml",
    yaml: "yaml",
    toml: "toml",
    ini: "ini",
    conf: "nginx",
    sql: "sql",
  };
  return languageMap[ext || ""] || "plaintext";
};

export const CodeEditor = ({ 
  file, 
  open, 
  onOpenChange, 
  onGetContent, 
  onSaveContent 
}: CodeEditorProps) => {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);

  const hasChanges = content !== originalContent;
  const language = getLanguage(file.name);

  useEffect(() => {
    if (open && file) {
      setLoading(true);
      onGetContent(file.path).then((text) => {
        const fileContent = text || "";
        setContent(fileContent);
        setOriginalContent(fileContent);
        setLineCount(fileContent.split("\n").length);
        setLoading(false);
      });
    }
  }, [open, file, onGetContent]);

  const handleSave = async () => {
    setSaving(true);
    const success = await onSaveContent(file.path, content);
    if (success) {
      setOriginalContent(content);
    }
    setSaving(false);
  };

  const handleUndo = () => {
    setContent(originalContent);
    setLineCount(originalContent.split("\n").length);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setLineCount(newContent.split("\n").length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newContent = content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);
      // Set cursor position after tab
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }

    // Handle Ctrl+S / Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      if (hasChanges) {
        handleSave();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileCode className="w-5 h-5 text-primary" />
              {file.name}
              {hasChanges && (
                <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                  Unsaved
                </span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {language}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!hasChanges}
            >
              <Undo className="w-4 h-4 mr-1" />
              Revert
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-success" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {lineCount} lines
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="bg-primary text-primary-foreground"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading file...</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              {/* Line numbers */}
              <div className="w-12 bg-muted/50 border-r border-border text-right pr-2 py-3 select-none overflow-hidden shrink-0">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i} className="text-xs text-muted-foreground leading-6 h-6">
                    {i + 1}
                  </div>
                ))}
              </div>
              
              {/* Code area */}
              <textarea
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                className={cn(
                  "flex-1 w-full h-full p-3 bg-background text-foreground resize-none focus:outline-none",
                  "font-mono text-sm leading-6",
                  "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                )}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-4">
            <span>{file.path}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>UTF-8</span>
            <span>LF</span>
            <span className="text-primary">{language.toUpperCase()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
