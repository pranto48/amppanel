import { useState, useEffect } from "react";
import { Shield, Copy, CheckCircle, Loader2, Smartphone, Key, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { use2FA } from "@/hooks/use2FA";

export const TwoFactorSetup = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    otpauthUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  
  const { toast } = useToast();
  const { isLoading, error, getStatus, setup, verify, disable } = use2FA();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const enabled = await getStatus();
    setIs2FAEnabled(enabled);
  };

  const handleSetup = async () => {
    const data = await setup();
    if (data) {
      setSetupData(data);
      setSetupDialogOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error || "Failed to initialize 2FA setup",
      });
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
      });
      return;
    }

    const success = await verify(verificationCode);
    if (success) {
      setIs2FAEnabled(true);
      setShowBackupCodes(true);
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication is now active",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error || "Invalid code. Please try again.",
      });
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
      });
      return;
    }

    const success = await disable(disableCode);
    if (success) {
      setIs2FAEnabled(false);
      setDisableDialogOpen(false);
      setDisableCode("");
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed to Disable",
        description: error || "Invalid code. Please try again.",
      });
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const copyBackupCodes = () => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join("\n"));
      toast({
        title: "Copied",
        description: "Backup codes copied to clipboard",
      });
    }
  };

  const closeSetupDialog = () => {
    setSetupDialogOpen(false);
    setSetupData(null);
    setVerificationCode("");
    setShowBackupCodes(false);
    setCopiedSecret(false);
  };

  return (
    <>
      <Card className="glass-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security using an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Authenticator App
                </p>
                <p className="text-xs text-muted-foreground">
                  Google Authenticator, Authy, or similar
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                is2FAEnabled
                  ? "bg-success/20 text-success border-success/30"
                  : "bg-muted text-muted-foreground"
              }
            >
              {is2FAEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          {is2FAEnabled ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setDisableDialogOpen(true)}
            >
              <Shield className="w-4 h-4 mr-2" />
              Disable Two-Factor Authentication
            </Button>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-primary to-info"
              onClick={handleSetup}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Enable Two-Factor Authentication
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupDialogOpen} onOpenChange={closeSetupDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {showBackupCodes ? "Save Your Backup Codes" : "Set Up 2FA"}
            </DialogTitle>
            <DialogDescription>
              {showBackupCodes
                ? "Save these backup codes in a safe place. You can use them if you lose access to your authenticator app."
                : "Scan the QR code with your authenticator app or enter the secret manually."}
            </DialogDescription>
          </DialogHeader>

          {!showBackupCodes ? (
            <div className="space-y-6">
              {/* QR Code Placeholder - You can integrate a QR library */}
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-lg">
                  {setupData?.otpauthUrl && (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        setupData.otpauthUrl
                      )}`}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan with Google Authenticator, Authy, or similar app
                </p>
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Or enter this code manually:
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono text-foreground break-all">
                    {setupData?.secret}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copySecret}
                  >
                    {copiedSecret ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-2">
                <Label htmlFor="verificationCode">
                  Enter the 6-digit code from your app
                </Label>
                <Input
                  id="verificationCode"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="bg-secondary border-border text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeSetupDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="bg-primary"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Verify & Enable
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning">
                      Save these codes now!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Each code can only be used once
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {setupData?.backupCodes.map((code, index) => (
                  <code
                    key={index}
                    className="p-2 bg-muted rounded text-center text-sm font-mono"
                  >
                    {code}
                  </code>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={copyBackupCodes}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All Codes
              </Button>

              <DialogFooter>
                <Button onClick={closeSetupDialog} className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your current 2FA code to disable two-factor authentication.
              This will make your account less secure.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="disableCode">Authenticator Code</Label>
            <Input
              id="disableCode"
              placeholder="000000"
              value={disableCode}
              onChange={(e) =>
                setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="bg-secondary border-border text-center text-xl tracking-widest font-mono mt-2"
              maxLength={6}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={isLoading || disableCode.length !== 6}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
