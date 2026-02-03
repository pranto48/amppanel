import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu, MemoryStick, HardDrive, Network, ChevronRight } from "lucide-react";
import { SiteMetricsFilter } from "@/components/SiteMetricsFilter";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { UpdateBanner } from "@/components/UpdateBanner";
import { StatCard } from "@/components/StatCard";
import { QuickActions } from "@/components/QuickActions";
import { SitesTable } from "@/components/SitesTable";
import { SystemServices } from "@/components/SystemServices";
import { ResourceChart } from "@/components/ResourceChart";
import { RecentActivity } from "@/components/RecentActivity";
import { SitesManagement } from "@/components/SitesManagement";
import { MonitoringPage } from "@/components/MonitoringPage";
import { UsersManagement } from "@/components/UsersManagement";
import { DatabasesManagement } from "@/components/DatabasesManagement";
import { FileManager } from "@/components/FileManager";
import { Terminal } from "@/components/Terminal";
import { SecurityManagement } from "@/components/SecurityManagement";
import { DNSManager } from "@/components/DNSManager";
import { FTPManager } from "@/components/FTPManager";
import { SubdomainManager } from "@/components/SubdomainManager";
import { BackupsManagement } from "@/components/BackupsManagement";
import { SettingsPage } from "@/components/SettingsPage";
import { ActivityLogsPage } from "@/components/ActivityLogsPage";
import { EmailManagement } from "@/components/EmailManagement";
import { PluginsPage } from "@/components/PluginsPage";
import { useAuth } from "@/hooks/useAuth";
import { useLogActivity } from "@/hooks/useActivityLogs";
import { useLatestMetrics, formatBytes } from "@/hooks/useSystemMetrics";
import { cn } from "@/lib/utils";

// Dashboard content component with real metrics
const DashboardContent = ({ 
  user, 
  setActiveItem, 
  selectedSiteId, 
  onSiteChange 
}: { 
  user: any; 
  setActiveItem: (item: string) => void;
  selectedSiteId: string | undefined;
  onSiteChange: (siteId: string | undefined) => void;
}) => {
  const { data: metrics } = useLatestMetrics(selectedSiteId);

  const cpuPercent = Math.round(metrics?.cpu_percent || 0);
  const memoryPercent = metrics ? Math.round((metrics.memory_used_mb / metrics.memory_total_mb) * 100) : 0;
  const diskPercent = metrics ? Math.round((metrics.disk_used_gb / metrics.disk_total_gb) * 100) : 0;
  const networkTotal = metrics ? metrics.network_in_mbps + metrics.network_out_mbps : 0;
  const networkPercent = Math.min(100, Math.round(networkTotal));

  return (
    <>
      {/* Page title with site filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {user.email}!</p>
        </div>
        <SiteMetricsFilter 
          selectedSiteId={selectedSiteId} 
          onSiteChange={onSiteChange} 
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="CPU Usage"
          value={`${cpuPercent}%`}
          subtitle={metrics?.load_avg_1m ? `Load: ${metrics.load_avg_1m.toFixed(2)}` : "4 Cores @ 3.2 GHz"}
          icon={Cpu}
          percentage={cpuPercent}
          color="primary"
        />
        <StatCard 
          title="Memory"
          value={formatBytes(metrics?.memory_used_mb || 0)}
          subtitle={`of ${formatBytes(metrics?.memory_total_mb || 16384)} total`}
          icon={MemoryStick}
          percentage={memoryPercent}
          color="success"
        />
        <StatCard 
          title="Disk Usage"
          value={`${(metrics?.disk_used_gb || 0).toFixed(0)} GB`}
          subtitle={`of ${(metrics?.disk_total_gb || 500).toFixed(0)} GB total`}
          icon={HardDrive}
          percentage={diskPercent}
          color="warning"
        />
        <StatCard 
          title="Network"
          value={`${networkTotal.toFixed(1)} Mb/s`}
          subtitle={`↓${(metrics?.network_in_mbps || 0).toFixed(1)} ↑${(metrics?.network_out_mbps || 0).toFixed(1)}`}
          icon={Network}
          percentage={networkPercent}
          color="info"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <QuickActions onNavigate={setActiveItem} />
      </div>

      {/* Charts and Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ResourceChart siteId={selectedSiteId} />
        </div>
        <div>
          <SystemServices />
        </div>
      </div>

      {/* Sites table and Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SitesTable />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </>
  );
};

const Index = () => {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasLoggedLogin, setHasLoggedLogin] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(undefined);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { logLogin } = useLogActivity();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Log login activity once when user is authenticated
  useEffect(() => {
    if (user && !hasLoggedLogin) {
      logLogin();
      setHasLoggedLogin(true);
    }
  }, [user, hasLoggedLogin, logLogin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading AMP Panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeItem) {
      case "plugins":
        return <PluginsPage />;
      case "sites":
        return <SitesManagement />;
      case "subdomains":
        return <SubdomainManager />;
      case "databases":
        return <DatabasesManagement />;
      case "files":
        return <FileManager />;
      case "ftp":
        return <FTPManager />;
      case "backups":
        return <BackupsManagement />;
      case "terminal":
        return <Terminal />;
      case "users":
        return <UsersManagement />;
      case "security":
        return <SecurityManagement />;
      case "dns":
        return <DNSManager />;
      case "monitoring":
        return <MonitoringPage />;
      case "activity":
        return <ActivityLogsPage />;
      case "email":
        return <EmailManagement />;
      case "settings":
        return <SettingsPage />;
      case "dashboard":
      default:
        return (
          <DashboardContent 
            user={user} 
            setActiveItem={setActiveItem} 
            selectedSiteId={selectedSiteId}
            onSiteChange={setSelectedSiteId}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 transform lg:translate-x-0 transition-all duration-300 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          activeItem={activeItem} 
          onItemClick={setActiveItem}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Floating expand button when sidebar is collapsed - desktop only */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden lg:flex fixed left-2 top-1/2 -translate-y-1/2 z-50 w-8 h-16 items-center justify-center bg-sidebar border border-sidebar-border rounded-r-lg shadow-lg hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 group"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      )}

      {/* Main content - responsive padding for sidebar */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-20 xl:pl-64"
      )}>
        <UpdateBanner />
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-4 sm:p-6 animate-fade-in">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
