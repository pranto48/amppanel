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
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sites", label: "Sites", icon: Globe },
  { id: "databases", label: "Databases", icon: Database },
  { id: "files", label: "File Manager", icon: FolderOpen },
  { id: "users", label: "Users", icon: Users },
  { id: "email", label: "Email", icon: Mail },
  { id: "dns", label: "DNS Manager", icon: HardDrive },
  { id: "security", label: "Security", icon: Shield },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar = ({ activeItem, onItemClick }: SidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">A</span>
        </div>
        <div>
          <h1 className="font-bold text-lg text-foreground">AMP Panel</h1>
          <p className="text-xs text-muted-foreground">Server Control</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onItemClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                  {item.label}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Server Status */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="glass-card rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-foreground">Server Online</span>
          </div>
          <p className="text-xs text-muted-foreground">Ubuntu 22.04 LTS</p>
          <p className="text-xs text-muted-foreground">Uptime: 45 days</p>
        </div>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};
