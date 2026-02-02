import { useState, useRef, useEffect, useCallback } from "react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface HistoryEntry {
  id: string;
  type: "input" | "output" | "error" | "system";
  content: string;
  timestamp: Date;
}

export const Terminal = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: "welcome",
      type: "system",
      content: `Welcome to AMP Panel Terminal
Type 'help' for a list of available commands.
`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  const addToHistory = (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
    setHistory((prev) => [
      ...prev,
      {
        ...entry,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      },
    ]);
  };

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    addToHistory({ type: "input", content: `root@amp-server:~# ${command}` });
    
    // Add to command history for navigation
    setCommandHistory((prev) => [...prev.filter(c => c !== command), command]);
    setHistoryIndex(-1);

    // Handle local commands
    if (command.trim().toLowerCase() === "clear") {
      setHistory([]);
      return;
    }

    if (command.trim().toLowerCase() === "exit") {
      addToHistory({ type: "system", content: "logout" });
      return;
    }

    if (command.trim().toLowerCase() === "history") {
      const historyOutput = commandHistory
        .map((cmd, i) => `  ${i + 1}  ${cmd}`)
        .join("\n");
      addToHistory({ type: "output", content: historyOutput || "No commands in history" });
      return;
    }

    setIsExecuting(true);

    try {
      const { data, error } = await supabase.functions.invoke("terminal", {
        body: { command: command.trim() },
      });

      if (error) throw error;

      if (data.output === "__CLEAR__") {
        setHistory([]);
      } else if (data.output === "__EXIT__") {
        addToHistory({ type: "system", content: "logout" });
      } else {
        addToHistory({
          type: data.exitCode === 0 ? "output" : "error",
          content: data.output,
        });
      }
    } catch (error: any) {
      addToHistory({
        type: "error",
        content: `Error: ${error.message || "Failed to execute command"}`,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isExecuting) {
      executeCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      addToHistory({ type: "input", content: `root@amp-server:~# ${input}^C` });
      setInput("");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  if (!user) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <TerminalIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Authentication Required</h3>
        <p className="text-muted-foreground">Please log in to access the terminal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Terminal</h2>
          <p className="text-muted-foreground">Execute server commands directly from your browser</p>
        </div>
      </div>

      {/* Terminal Window */}
      <div
        className={cn(
          "glass-card rounded-xl overflow-hidden transition-all duration-300",
          isFullscreen && "fixed inset-4 z-50"
        )}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-success" />
            </div>
            <span className="text-sm text-muted-foreground font-mono">
              root@amp-server: ~
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded hover:bg-muted transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {isFullscreen && (
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Terminal Content */}
        <div
          ref={terminalRef}
          onClick={handleTerminalClick}
          className={cn(
            "bg-[#0d1117] p-4 font-mono text-sm overflow-auto cursor-text",
            isFullscreen ? "h-[calc(100%-44px)]" : "h-[500px]"
          )}
        >
          {/* History */}
          {history.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "whitespace-pre-wrap break-all mb-1",
                entry.type === "input" && "text-[#58a6ff]",
                entry.type === "output" && "text-[#c9d1d9]",
                entry.type === "error" && "text-[#f85149]",
                entry.type === "system" && "text-[#8b949e]"
              )}
            >
              {entry.content}
            </div>
          ))}

          {/* Input Line */}
          <div className="flex items-center">
            <span className="text-[#58a6ff] shrink-0">root@amp-server:~# </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isExecuting}
              className="flex-1 bg-transparent text-[#c9d1d9] outline-none caret-[#58a6ff]"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            {isExecuting && (
              <span className="text-[#8b949e] animate-pulse ml-2">●</span>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-muted/30 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>bash</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Ln 1, Col 1</span>
            <span className="text-success">● Connected</span>
          </div>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Quick Commands</h3>
        <div className="flex flex-wrap gap-2">
          {[
            "neofetch",
            "htop",
            "free -h",
            "df -h",
            "systemctl list-units",
            "netstat -tuln",
            "ip addr",
          ].map((cmd) => (
            <button
              key={cmd}
              onClick={() => {
                setInput(cmd);
                inputRef.current?.focus();
              }}
              className="px-3 py-1.5 text-xs font-mono bg-secondary hover:bg-muted rounded-lg transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
