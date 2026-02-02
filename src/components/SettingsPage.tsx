import { useState } from "react";
import {
  Settings as SettingsIcon,
  Lock,
  Shield,
  Key,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle,
  LogOut,
  User,
  Mail,
  Download,
  Cpu,
  ExternalLink,
  Sparkles,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFirmwareUpdate, CURRENT_VERSION } from "@/hooks/useFirmwareUpdate";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Mock session data
const mockSessions = [
  {
    id: "1",
    device: "Chrome on Windows",
    location: "New York, US",
    ip: "192.168.1.100",
    lastActive: "Active now",
    current: true,
    icon: Monitor,
  },
  {
    id: "2",
    device: "Safari on iPhone",
    location: "New York, US",
    ip: "192.168.1.101",
    lastActive: "2 hours ago",
    current: false,
    icon: Smartphone,
  },
  {
    id: "3",
    device: "Firefox on Mac",
    location: "Los Angeles, US",
    ip: "10.0.0.50",
    lastActive: "1 day ago",
    current: false,
    icon: Monitor,
  },
];

// Mock login history
const mockLoginHistory = [
  { date: "2026-02-02 14:30:00", ip: "192.168.1.100", location: "New York, US", status: "success" },
  { date: "2026-02-02 10:15:00", ip: "192.168.1.100", location: "New York, US", status: "success" },
  { date: "2026-02-01 18:45:00", ip: "192.168.1.101", location: "New York, US", status: "success" },
  { date: "2026-02-01 08:20:00", ip: "45.142.120.92", location: "Unknown", status: "failed" },
  { date: "2026-01-31 22:10:00", ip: "192.168.1.100", location: "New York, US", status: "success" },
];

export const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    updateInfo,
    isChecking,
    isUpdating,
    updateProgress,
    checkForUpdates,
    triggerUpdate,
    currentVersion,
  } = useFirmwareUpdate();
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Security settings state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  
  // Dialogs
  const [logoutAllDialogOpen, setLogoutAllDialogOpen] = useState(false);
  const [revokeSessionId, setRevokeSessionId] = useState<string | null>(null);

  const handlePasswordChange = async () => {
    // Validate
    const result = passwordSchema.safeParse(passwordForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0]] = err.message;
      });
      setPasswordErrors(errors);
      return;
    }
    
    setPasswordErrors({});
    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    // In production, this would call an API to revoke the session
    toast({
      title: "Session Revoked",
      description: "The session has been terminated.",
    });
    setRevokeSessionId(null);
  };

  const handleLogoutAll = () => {
    // In production, this would call an API to revoke all sessions
    toast({
      title: "All Sessions Terminated",
      description: "You have been logged out from all devices.",
    });
    setLogoutAllDialogOpen(false);
  };

  const handleToggle2FA = () => {
    if (!twoFactorEnabled) {
      toast({
        title: "Two-Factor Authentication",
        description: "2FA setup wizard would open here. (Demo)",
      });
    } else {
      setTwoFactorEnabled(false);
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your account and security settings</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-secondary border border-border flex-wrap">
          <TabsTrigger value="account" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Monitor className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="firmware" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Cpu className="w-4 h-4 mr-2" />
            Firmware
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Profile Info */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{user?.email || "admin@example.com"}</span>
                    <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                      Verified
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">Administrator</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "January 15, 2026"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password regularly for better security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="bg-secondary border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="bg-secondary border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="bg-secondary border-border pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Two-Factor Authentication */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {twoFactorEnabled ? "2FA is enabled" : "2FA is disabled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {twoFactorEnabled
                      ? "Your account is protected with an authenticator app"
                      : "Enable 2FA to secure your account with an authenticator app"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    twoFactorEnabled
                      ? "bg-success/20 text-success border-success/30"
                      : "bg-warning/20 text-warning border-warning/30"
                  }
                >
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <Button
                variant={twoFactorEnabled ? "destructive" : "default"}
                onClick={handleToggle2FA}
              >
                {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
              </Button>
            </CardContent>
          </Card>

          {/* Security Preferences */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security Preferences
              </CardTitle>
              <CardDescription>Configure security options for your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Login Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified when someone logs into your account
                  </p>
                </div>
                <Switch
                  checked={loginAlertsEnabled}
                  onCheckedChange={setLoginAlertsEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    value={sessionTimeoutMinutes}
                    onChange={(e) => setSessionTimeoutMinutes(parseInt(e.target.value) || 30)}
                    className="w-24 bg-secondary border-border"
                    min={5}
                    max={1440}
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatically log out after inactivity
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login History */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Login Activity
              </CardTitle>
              <CardDescription>Monitor recent login attempts to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLoginHistory.map((login, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {login.status === "success" ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      )}
                      <div>
                        <p className="text-sm text-foreground">{login.date}</p>
                        <p className="text-xs text-muted-foreground">
                          {login.ip} • {login.location}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        login.status === "success"
                          ? "bg-success/20 text-success border-success/30"
                          : "bg-destructive/20 text-destructive border-destructive/30"
                      }
                    >
                      {login.status === "success" ? "Success" : "Failed"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card className="glass-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription>Manage devices logged into your account</CardDescription>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setLogoutAllDialogOpen(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSessions.map((session) => {
                  const Icon = session.icon;
                  return (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        session.current
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{session.device}</p>
                            {session.current && (
                              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <Globe className="w-3 h-3 inline mr-1" />
                            {session.location} • {session.ip}
                          </p>
                          <p className="text-xs text-muted-foreground">{session.lastActive}</p>
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setRevokeSessionId(session.id)}
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Revoke Session Dialog */}
      <AlertDialog open={!!revokeSessionId} onOpenChange={() => setRevokeSessionId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will log out the device from your account. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeSessionId && handleRevokeSession(revokeSessionId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout All Dialog */}
      <AlertDialog open={logoutAllDialogOpen} onOpenChange={setLogoutAllDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Logout All Devices</AlertDialogTitle>
            <AlertDialogDescription>
              This will log out all devices from your account, including this one.
              You will need to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAll}
              className="bg-destructive hover:bg-destructive/90"
            >
              Logout All Devices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        {/* Firmware Tab */}
        <TabsContent value="firmware" className="space-y-6">
          {/* Current Version */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Panel Information
              </CardTitle>
              <CardDescription>Current firmware version and update status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Current Version</p>
                  <p className="text-2xl font-bold text-primary">v{currentVersion}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    updateInfo?.hasUpdate
                      ? "bg-warning/20 text-warning border-warning/30"
                      : "bg-success/20 text-success border-success/30"
                  }
                >
                  {updateInfo?.hasUpdate ? "Update Available" : "Up to Date"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Source Repository</Label>
                  <a
                    href="https://github.com/pranto48/amppanel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Github className="w-4 h-4" />
                    pranto48/amppanel
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Last Checked</Label>
                  <p className="text-foreground">
                    {isChecking ? "Checking..." : "Just now"}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => checkForUpdates()}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check for Updates
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Update Available Card */}
          {updateInfo?.hasUpdate && (
            <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/5 to-info/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  New Version Available
                </CardTitle>
                <CardDescription>
                  Version {updateInfo.latestVersion} is ready to install
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {updateInfo.releaseName && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Release Name</Label>
                    <p className="text-foreground font-medium">{updateInfo.releaseName}</p>
                  </div>
                )}

                {updateInfo.publishedAt && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Published</Label>
                    <p className="text-foreground">
                      {new Date(updateInfo.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                {updateInfo.changelog && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Changelog</Label>
                    <div className="p-4 rounded-lg bg-muted/50 max-h-48 overflow-y-auto">
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                        {updateInfo.changelog}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  {isUpdating ? (
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Updating...</span>
                        <span className="text-foreground font-medium">{updateProgress}%</span>
                      </div>
                      <Progress value={updateProgress} className="h-2" />
                    </div>
                  ) : (
                    <>
                      <Button
                        className="bg-gradient-to-r from-primary to-info text-primary-foreground"
                        onClick={triggerUpdate}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Install Update
                      </Button>
                      {updateInfo.releaseUrl && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(updateInfo.releaseUrl, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on GitHub
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Update History - Placeholder */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Update History
              </CardTitle>
              <CardDescription>Recent firmware updates applied to this panel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-sm font-medium text-foreground">v{currentVersion}</p>
                      <p className="text-xs text-muted-foreground">Initial installation</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                    Current
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
    </div>
  );
};
