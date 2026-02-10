import { useState } from "react";
import { 
  LayoutDashboard, 
  Globe, 
  Database, 
  FolderOpen, 
  Shield, 
  Settings, 
  Terminal,
  Users,
  Mail,
  HardDrive,
  Activity,
  LogOut,
  Upload,
  Layers,
  Archive,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardList,
  Store,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "plugins", label: "Plugins", icon: Store },
  { id: "sites", label: "Sites", icon: Globe },
  { id: "subdomains", label: "Subdomains", icon: Layers },
  { id: "databases", label: "Databases", icon: Database },
  { id: "files", label: "File Manager", icon: FolderOpen },
  { id: "ftp", label: "FTP Accounts", icon: Upload },
  { id: "backups", label: "Backups", icon: Archive },
  { id: "cronjobs", label: "Cron Jobs", icon: Clock },
  { id: "users", label: "Users", icon: Users },
  { id: "email", label: "Email", icon: Mail },
  { id: "dns", label: "DNS Manager", icon: HardDrive },
  { id: "security", label: "Security", icon: Shield },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "activity", label: "Activity Logs", icon: ClipboardList },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar = ({ 
  activeItem, 
  onItemClick, 
  isOpen, 
  onClose,
  collapsed = false,
  onCollapsedChange
}: SidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleItemClick = (id: string) => {
    onItemClick(id);
    onClose?.();
  };

  const toggleCollapsed = () => {
    onCollapsedChange?.(!collapsed);
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border transition-all duration-300",
        collapsed && "justify-center px-2"
      )}>
        <div className={cn(
          "rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25",
          collapsed ? "w-10 h-10" : "w-10 h-10"
        )}>
          <span className="text-primary-foreground font-bold text-lg">A</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-bold text-lg text-foreground">AMP Panel</h1>
            <p className="text-xs text-muted-foreground">Server Control</p>
          </div>
        )}
        
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden hover:bg-destructive/10 hover:text-destructive"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Collapse toggle - desktop only */}
      <div className="hidden lg:flex justify-end px-2 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all duration-200"
        >
          <div className="transition-transform duration-300">
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </div>
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <li 
                key={item.id}
                style={{ animationDelay: `${index * 30}ms` }}
                className="animate-fade-in"
              >
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    collapsed ? "px-3 py-3 justify-center" : "px-4 py-2.5",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Background animation on hover */}
                  <span className={cn(
                    "absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    isActive && "opacity-100"
                  )} />
                  
                  {/* Icon with animation */}
                  <Icon className={cn(
                    "w-5 h-5 relative z-10 transition-all duration-200",
                    isActive 
                      ? "text-primary animate-pulse" 
                      : "group-hover:scale-110 group-hover:text-primary"
                  )} />
                  
                  {/* Label with slide animation */}
                  {!collapsed && (
                    <span className="relative z-10 whitespace-nowrap transition-transform duration-200 group-hover:translate-x-0.5">
                      {item.label}
                    </span>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className={cn(
                      "absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse",
                      collapsed && "right-1"
                    )} />
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      <span className="text-sm text-popover-foreground">{item.label}</span>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-popover border-l border-b border-border rotate-45" />
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Server Status */}
      <div className={cn(
        "p-3 border-t border-sidebar-border transition-all duration-300",
        collapsed && "px-2"
      )}>
        <div className={cn(
          "glass-card rounded-lg p-3 transition-all duration-300 hover:shadow-md hover:shadow-success/10",
          collapsed && "p-2"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-lg shadow-success/50" />
            {!collapsed && (
              <span className="text-xs font-medium text-foreground animate-fade-in">Server Online</span>
            )}
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <p className="text-xs text-muted-foreground">Ubuntu 22.04 LTS</p>
              <p className="text-xs text-muted-foreground">Uptime: 45 days</p>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <div className={cn(
        "p-3 border-t border-sidebar-border",
        collapsed && "px-2"
      )}>
        <button 
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg text-sm font-medium text-muted-foreground transition-all duration-200 group hover:bg-destructive/10 hover:text-destructive",
            collapsed ? "px-3 py-3 justify-center" : "px-4 py-2.5"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-x-0.5" />
          {!collapsed && (
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              Logout
            </span>
          )}
        </button>
      </div>

      {/* Version */}
      <div className={cn(
        "px-4 py-2 border-t border-sidebar-border",
        collapsed && "px-2 text-center"
      )}>
        <a
          href={`https://github.com/Jeamorg/amp-panel/commit/${import.meta.env.VITE_GIT_HASH || 'main'}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground/60 font-mono hover:text-primary transition-colors"
        >
          {collapsed ? (import.meta.env.VITE_GIT_HASH || 'dev') : `AMP Panel · ${import.meta.env.VITE_GIT_HASH || 'dev'}`}
        </a>
      </div>
    </aside>
  );
};
