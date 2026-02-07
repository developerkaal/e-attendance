 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 
 export default function Login() {
   const [isLogin, setIsLogin] = useState(true);
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [fullName, setFullName] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [loading, setLoading] = useState(false);
   const { signIn, signUp } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     try {
       if (isLogin) {
         const { error } = await signIn(email, password);
         if (error) {
           toast({
             title: "Login Failed",
             description: error.message,
             variant: "destructive",
           });
         } else {
           navigate("/dashboard");
         }
       } else {
         if (!fullName.trim()) {
           toast({
             title: "Error",
             description: "Please enter your full name",
             variant: "destructive",
           });
           setLoading(false);
           return;
         }
         const { error } = await signUp(email, password, fullName);
         if (error) {
           toast({
             title: "Sign Up Failed",
             description: error.message,
             variant: "destructive",
           });
         } else {
           toast({
             title: "Check your email",
             description: "We sent you a confirmation link to verify your account.",
           });
         }
       }
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <div className="min-h-screen flex">
       {/* Left side - Form */}
       <div className="flex-1 flex items-center justify-center p-8">
         <div className="w-full max-w-md space-y-8 animate-fade-in">
           {/* Logo */}
           <div className="text-center">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg mb-4">
               <GraduationCap className="w-8 h-8 text-primary-foreground" />
             </div>
             <h1 className="text-2xl font-bold text-foreground">SmartAttend</h1>
             <p className="text-muted-foreground mt-1">
               Smart Attendance Management System
             </p>
           </div>
 
           {/* Form */}
           <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
             <h2 className="text-xl font-semibold text-foreground mb-6">
               {isLogin ? "Welcome back" : "Create your account"}
             </h2>
 
             <form onSubmit={handleSubmit} className="space-y-5">
               {!isLogin && (
                 <div className="space-y-2">
                   <Label htmlFor="fullName">Full Name</Label>
                   <Input
                     id="fullName"
                     type="text"
                     placeholder="John Doe"
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     required={!isLogin}
                     className="h-11"
                   />
                 </div>
               )}
 
               <div className="space-y-2">
                 <Label htmlFor="email">Email</Label>
                 <Input
                   id="email"
                   type="email"
                   placeholder="you@example.com"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   className="h-11"
                 />
               </div>
 
               <div className="space-y-2">
                 <Label htmlFor="password">Password</Label>
                 <div className="relative">
                   <Input
                     id="password"
                     type={showPassword ? "text" : "password"}
                     placeholder="••••••••"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     required
                     className="h-11 pr-10"
                   />
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                   >
                     {showPassword ? (
                       <EyeOff className="w-4 h-4" />
                     ) : (
                       <Eye className="w-4 h-4" />
                     )}
                   </button>
                 </div>
               </div>
 
               <Button
                 type="submit"
                 className="w-full h-11 font-medium"
                 disabled={loading}
               >
                 {loading ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : isLogin ? (
                   "Sign In"
                 ) : (
                   "Create Account"
                 )}
               </Button>
             </form>
 
             <div className="mt-6 text-center">
               <button
                 type="button"
                 onClick={() => setIsLogin(!isLogin)}
                 className="text-sm text-muted-foreground hover:text-primary transition-colors"
               >
                 {isLogin
                   ? "Don't have an account? Sign up"
                   : "Already have an account? Sign in"}
               </button>
             </div>
           </div>
         </div>
       </div>
 
       {/* Right side - Decorative */}
       <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-8">
         <div className="max-w-md text-center text-primary-foreground animate-slide-up">
           <div className="w-24 h-24 rounded-3xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8">
             <GraduationCap className="w-12 h-12" />
           </div>
           <h2 className="text-3xl font-bold mb-4">
             Streamline Your Attendance Tracking
           </h2>
           <p className="text-lg opacity-90">
             Manage classes, students, and attendance effortlessly. Generate
             detailed reports and analytics with just a few clicks.
           </p>
           <div className="mt-8 grid grid-cols-3 gap-4">
             <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
               <p className="text-2xl font-bold">100%</p>
               <p className="text-sm opacity-80">Accurate</p>
             </div>
             <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
               <p className="text-2xl font-bold">Fast</p>
               <p className="text-sm opacity-80">Efficient</p>
             </div>
             <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
               <p className="text-2xl font-bold">Secure</p>
               <p className="text-sm opacity-80">Protected</p>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }