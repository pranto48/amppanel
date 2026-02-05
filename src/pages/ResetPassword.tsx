 import { useState, useEffect } from "react";
 import { useNavigate, useSearchParams } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { useToast } from "@/hooks/use-toast";
 import { Eye, EyeOff, Lock, Server, Loader2, KeyRound } from "lucide-react";
 import { z } from "zod";
 
 const passwordSchema = z.object({
   password: z.string().min(8, "Password must be at least 8 characters"),
   confirmPassword: z.string(),
 }).refine((data) => data.password === data.confirmPassword, {
   message: "Passwords don't match",
   path: ["confirmPassword"],
 });
 
 const ResetPassword = () => {
   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [loading, setLoading] = useState(false);
   const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
   const [isValidSession, setIsValidSession] = useState(false);
   const [checkingSession, setCheckingSession] = useState(true);
   
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const { toast } = useToast();
 
   useEffect(() => {
     // Check if we have a valid recovery session
     const checkSession = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       
       // Check if this is a recovery session
       if (session?.user) {
         setIsValidSession(true);
       } else {
         // Check URL for recovery token
         const type = searchParams.get('type');
         if (type === 'recovery') {
           // The auth listener should handle setting the session
           setIsValidSession(true);
         }
       }
       setCheckingSession(false);
     };
 
     checkSession();
 
     // Listen for auth state changes (for recovery flow)
     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
       if (event === 'PASSWORD_RECOVERY') {
         setIsValidSession(true);
         setCheckingSession(false);
       }
     });
 
     return () => subscription.unsubscribe();
   }, [searchParams]);
 
   const validateForm = () => {
     try {
       passwordSchema.parse({ password, confirmPassword });
       setErrors({});
       return true;
     } catch (error) {
       if (error instanceof z.ZodError) {
         const fieldErrors: { password?: string; confirmPassword?: string } = {};
         error.errors.forEach((err) => {
           if (err.path[0] === "password") fieldErrors.password = err.message;
           if (err.path[0] === "confirmPassword") fieldErrors.confirmPassword = err.message;
         });
         setErrors(fieldErrors);
       }
       return false;
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!validateForm()) return;
     
     setLoading(true);
 
     try {
       const { error } = await supabase.auth.updateUser({
         password: password,
       });
 
       if (error) {
         toast({
           variant: "destructive",
           title: "Password Reset Failed",
           description: error.message,
         });
       } else {
         // Update the password_changed_at timestamp
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
           await supabase
             .from('profiles')
             .update({ password_changed_at: new Date().toISOString() })
             .eq('id', user.id);
         }
 
         toast({
           title: "Password Updated!",
           description: "Your password has been successfully reset.",
         });
         
         // Sign out and redirect to login
         await supabase.auth.signOut();
         navigate("/auth");
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
 
   if (checkingSession) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (!isValidSession) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center p-6">
         <div className="text-center">
           <KeyRound className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
           <h1 className="text-2xl font-bold text-foreground mb-2">Invalid or Expired Link</h1>
           <p className="text-muted-foreground mb-6">
             This password reset link is invalid or has expired.
           </p>
           <Button onClick={() => navigate("/auth")}>
             Return to Login
           </Button>
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
           <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
           <p className="text-muted-foreground mt-2">Enter your new password</p>
         </div>
 
         {/* Reset Form */}
         <div className="glass-card rounded-2xl p-8">
           <form onSubmit={handleSubmit} className="space-y-5">
             <div className="space-y-2">
               <Label htmlFor="password" className="text-foreground">
                 New Password
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
 
             <div className="space-y-2">
               <Label htmlFor="confirmPassword" className="text-foreground">
                 Confirm Password
               </Label>
               <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                 <Input
                   id="confirmPassword"
                   type={showConfirmPassword ? "text" : "password"}
                   placeholder="••••••••"
                   value={confirmPassword}
                   onChange={(e) => setConfirmPassword(e.target.value)}
                   className="pl-11 pr-11 bg-secondary border-border focus:border-primary"
                 />
                 <button
                   type="button"
                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                   className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                 >
                   {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
               </div>
               {errors.confirmPassword && (
                 <p className="text-sm text-destructive">{errors.confirmPassword}</p>
               )}
             </div>
 
             <Button
               type="submit"
               disabled={loading}
               className="w-full bg-gradient-to-r from-primary to-info hover:opacity-90 text-primary-foreground font-medium py-5"
             >
               {loading ? (
                 <div className="flex items-center gap-2">
                   <Loader2 className="w-4 h-4 animate-spin" />
                   Updating Password...
                 </div>
               ) : (
                 "Reset Password"
               )}
             </Button>
           </form>
         </div>
       </div>
     </div>
   );
 };
 
 export default ResetPassword;