 import { useState } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { useToast } from "@/hooks/use-toast";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Eye, EyeOff, Lock, Loader2, ShieldAlert } from "lucide-react";
 import { z } from "zod";
 
 const passwordSchema = z.object({
   password: z.string().min(8, "Password must be at least 8 characters"),
   confirmPassword: z.string(),
 }).refine((data) => data.password === data.confirmPassword, {
   message: "Passwords don't match",
   path: ["confirmPassword"],
 });
 
 interface ChangePasswordModalProps {
   open: boolean;
   onPasswordChanged: () => void;
 }
 
 export function ChangePasswordModal({ open, onPasswordChanged }: ChangePasswordModalProps) {
   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const [loading, setLoading] = useState(false);
   const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
   
   const { toast } = useToast();
 
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
           title: "Password Change Failed",
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
           title: "Password Changed!",
           description: "Your password has been successfully updated.",
         });
         
         onPasswordChanged();
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
     <Dialog open={open} onOpenChange={() => {}}>
       <DialogContent 
         className="sm:max-w-md"
         onPointerDownOutside={(e) => e.preventDefault()}
         onEscapeKeyDown={(e) => e.preventDefault()}
       >
         <DialogHeader>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
               <ShieldAlert className="w-5 h-5 text-warning" />
             </div>
             <DialogTitle className="text-xl">Change Your Password</DialogTitle>
           </div>
           <DialogDescription className="text-left">
             You're using the default admin credentials. For security reasons, you must change your password before continuing.
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-4 mt-4">
           <div className="space-y-2">
             <Label htmlFor="new-password">New Password</Label>
             <div className="relative">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input
                 id="new-password"
                 type={showPassword ? "text" : "password"}
                 placeholder="Enter new password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="pl-10 pr-10"
               />
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
               >
                 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
               </button>
             </div>
             {errors.password && (
               <p className="text-sm text-destructive">{errors.password}</p>
             )}
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="confirm-password">Confirm Password</Label>
             <div className="relative">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input
                 id="confirm-password"
                 type={showConfirmPassword ? "text" : "password"}
                 placeholder="Confirm new password"
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 className="pl-10 pr-10"
               />
               <button
                 type="button"
                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
               >
                 {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
               </button>
             </div>
             {errors.confirmPassword && (
               <p className="text-sm text-destructive">{errors.confirmPassword}</p>
             )}
           </div>
 
           <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
             <p className="font-medium text-foreground mb-1">Password Requirements:</p>
             <ul className="list-disc list-inside space-y-1">
               <li>At least 8 characters long</li>
               <li>Different from the default password</li>
             </ul>
           </div>
 
           <Button
             type="submit"
             disabled={loading}
             className="w-full"
           >
             {loading ? (
               <div className="flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin" />
                 Updating Password...
               </div>
             ) : (
               "Change Password"
             )}
           </Button>
         </form>
       </DialogContent>
     </Dialog>
   );
 }