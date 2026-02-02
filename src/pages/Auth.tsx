import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Server, Settings, Loader2 } from "lucide-react";
import { z } from "zod";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
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

          <div className="mt-6 text-center">
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

          {/* Default Admin Section */}
          {isLogin && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">
                First time installation?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetupAdmin}
                  disabled={setupLoading}
                  className="flex-1 text-xs"
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
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleUseDefaultCredentials}
                  className="flex-1 text-xs"
                >
                  Use Default Login
                </Button>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Default Admin Credentials:</p>
                <p className="text-xs font-mono text-foreground">
                  Email: <span className="text-primary">{DEFAULT_ADMIN_EMAIL}</span>
                </p>
                <p className="text-xs font-mono text-foreground">
                  Password: <span className="text-primary">{DEFAULT_ADMIN_PASSWORD}</span>
                </p>
              </div>
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
