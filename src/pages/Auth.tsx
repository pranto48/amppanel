import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Server, Settings, Loader2, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { z } from "zod";
import { useIsAdminSetupComplete } from "@/hooks/useSystemSettings";

// Custom email validation that allows localhost for admin accounts
const emailSchema = z.string().refine(
  (email) => {
    // Allow admin_amp@localhost specifically
    if (email === "admin_amp@localhost") return true;
    // Standard email validation for other emails
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  { message: "Please enter a valid email address" }
);

const authSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const DEFAULT_ADMIN_EMAIL = "admin_amp@localhost";
const DEFAULT_ADMIN_PASSWORD = "Amp_Password";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

  // Check if admin setup is complete
  const { data: isAdminSetupComplete, isLoading: isCheckingSetup, refetch: refetchSetupStatus } = useIsAdminSetupComplete();
  
  // Track if setup was just completed in this session
  const [setupJustCompleted, setSetupJustCompleted] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only auto-navigate if not waiting for 2FA
      if (session?.user && !requires2FA) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !requires2FA) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, requires2FA]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "email") fieldErrors.email = err.message;
          if (err.path[0] === "password") fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSetupAdmin = async () => {
    setSetupLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("setup-admin");
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Admin Setup Complete",
          description: "Default admin account is ready. You can now log in.",
        });
        // Pre-fill the credentials
        setEmail(DEFAULT_ADMIN_EMAIL);
        setPassword(DEFAULT_ADMIN_PASSWORD);
        setIsLogin(true);
        setSetupJustCompleted(true);
        // Refetch to update the setup status
        refetchSetupStatus();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message || "Failed to setup default admin.",
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleUseDefaultCredentials = () => {
    setEmail(DEFAULT_ADMIN_EMAIL);
    setPassword(DEFAULT_ADMIN_PASSWORD);
    setIsLogin(true);
  };

  const check2FARequired = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("totp", {
        body: { action: "status" },
      });
      
      if (error) throw error;
      return data?.enabled || false;
    } catch (error) {
      console.error("Error checking 2FA status:", error);
      return false;
    }
  };

  const verify2FACode = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("totp", {
        body: { action: "validate", code: otpCode },
      });
      
      if (error) throw error;
      return data?.valid || false;
    } catch (error) {
      console.error("Error validating 2FA:", error);
      return false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address.",
      });
      return;
    }
    
    setForgotPasswordLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } else {
        toast({
          title: "Check Your Email",
          description: "If an account exists with that email, you will receive a password reset link.",
        });
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: error.message,
            });
          }
        } else {
          // Check if 2FA is enabled
          const has2FA = await check2FARequired();
          
          if (has2FA) {
            setRequires2FA(true);
            toast({
              title: "2FA Required",
              description: "Please enter your verification code.",
            });
          } else {
            toast({
              title: "Welcome back!",
              description: "You have been logged in successfully.",
            });
            navigate("/");
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              variant: "destructive",
              title: "Sign up failed",
              description: "This email is already registered. Please log in instead.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Sign up failed",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email to confirm your account.",
          });
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (otpCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
      });
      return;
    }

    setVerifying2FA(true);
    
    try {
      const isValid = await verify2FACode();
      
      if (isValid) {
        toast({
          title: "Welcome back!",
          description: "2FA verification successful.",
        });
        setRequires2FA(false);
        navigate("/");
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "The verification code is incorrect. Please try again.",
        });
        setOtpCode("");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Failed to verify code.",
      });
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleCancel2FA = async () => {
    await supabase.auth.signOut();
    setRequires2FA(false);
    setOtpCode("");
    toast({
      title: "Logged out",
      description: "You can try logging in again.",
    });
  };

  // 2FA Verification UI
  if (requires2FA) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-info/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Two-Factor Authentication</h1>
            <p className="text-muted-foreground mt-2">Enter the code from your authenticator app</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(value) => setOtpCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                You can also use a backup code if you don't have access to your authenticator app.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handle2FAVerify}
                  disabled={verifying2FA || otpCode.length !== 6}
                  className="w-full bg-gradient-to-r from-primary to-info hover:opacity-90 text-primary-foreground font-medium py-5"
                >
                  {verifying2FA ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    "Verify"
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleCancel2FA}
                  className="w-full"
                >
                  Cancel and go back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Forgot Password UI
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-info/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
                <Mail className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Forgot Password</h1>
            <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="your@email.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="pl-11 bg-secondary border-border focus:border-primary"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={forgotPasswordLoading}
                className="w-full bg-gradient-to-r from-primary to-info hover:opacity-90 text-primary-foreground font-medium py-5"
              >
                {forgotPasswordLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                ← Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-info/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
              <Server className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">AMP Panel</h1>
          <p className="text-muted-foreground mt-2">Server Control Made Simple</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 bg-secondary border-border focus:border-primary"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 bg-secondary border-border focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-info hover:opacity-90 text-primary-foreground font-medium py-5"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </div>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-4 flex flex-col items-center gap-2">
            {isLogin && (
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot your password?
              </button>
            )}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="font-medium text-primary">
                {isLogin ? "Sign up" : "Sign in"}
              </span>
            </button>
          </div>

          {/* Default Admin Section - Only show if setup not complete */}
          {isLogin && !isCheckingSetup && !isAdminSetupComplete && !setupJustCompleted && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">
                First time installation?
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSetupAdmin}
                disabled={setupLoading}
                className="w-full text-xs"
              >
                {setupLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Settings className="w-3 h-3 mr-1" />
                    Setup Admin
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Show credentials after setup just completed */}
          {isLogin && setupJustCompleted && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-success mb-2">✓ Admin Setup Complete!</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Your default admin credentials have been created:
                </p>
                <div className="bg-background/50 rounded p-2 space-y-1 text-xs font-mono">
                  <p><span className="text-muted-foreground">Email:</span> {DEFAULT_ADMIN_EMAIL}</p>
                  <p><span className="text-muted-foreground">Password:</span> {DEFAULT_ADMIN_PASSWORD}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Credentials are pre-filled above. Click "Sign In" to continue.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
