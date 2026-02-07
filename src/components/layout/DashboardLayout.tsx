 import { useState } from "react";
 import { useNavigate, useLocation, Outlet } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import {
   LayoutDashboard,
   GraduationCap,
   Users,
   ClipboardCheck,
   BarChart3,
   LogOut,
   Menu,
   X,
   ChevronRight,
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Avatar, AvatarFallback } from "@/components/ui/avatar";
 import { cn } from "@/lib/utils";
 
 const navItems = [
   { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
   { icon: GraduationCap, label: "Classes", path: "/classes" },
   { icon: Users, label: "Students", path: "/students" },
   { icon: ClipboardCheck, label: "Attendance", path: "/attendance" },
   { icon: BarChart3, label: "Reports", path: "/reports" },
 ];
 
 export function DashboardLayout() {
   const [sidebarOpen, setSidebarOpen] = useState(true);
   const [mobileOpen, setMobileOpen] = useState(false);
   const navigate = useNavigate();
   const location = useLocation();
   const { profile, signOut } = useAuth();
 
   const handleSignOut = async () => {
     await signOut();
     navigate("/login");
   };
 
   const getInitials = (name: string) => {
     return name
       .split(" ")
       .map((n) => n[0])
       .join("")
       .toUpperCase()
       .slice(0, 2);
   };
 
   return (
     <div className="min-h-screen flex w-full bg-background">
       {/* Mobile overlay */}
       {mobileOpen && (
         <div
           className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
           onClick={() => setMobileOpen(false)}
         />
       )}
 
       {/* Sidebar */}
       <aside
         className={cn(
           "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
           sidebarOpen ? "w-64" : "w-20",
           mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
         )}
       >
         {/* Logo */}
         <div className="h-16 flex items-center justify-between px-4 border-b border-border">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
               <GraduationCap className="w-5 h-5 text-primary-foreground" />
             </div>
             {sidebarOpen && (
               <span className="font-semibold text-foreground animate-fade-in">
                 SmartAttend
               </span>
             )}
           </div>
           <Button
             variant="ghost"
             size="icon"
             className="hidden lg:flex"
             onClick={() => setSidebarOpen(!sidebarOpen)}
           >
             <ChevronRight
               className={cn(
                 "w-4 h-4 transition-transform",
                 !sidebarOpen && "rotate-180"
               )}
             />
           </Button>
           <Button
             variant="ghost"
             size="icon"
             className="lg:hidden"
             onClick={() => setMobileOpen(false)}
           >
             <X className="w-5 h-5" />
           </Button>
         </div>
 
         {/* Navigation */}
         <nav className="flex-1 p-4 space-y-1">
           {navItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
               <button
                 key={item.path}
                 onClick={() => {
                   navigate(item.path);
                   setMobileOpen(false);
                 }}
                 className={cn(
                   "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                   isActive
                     ? "bg-primary text-primary-foreground shadow-md"
                     : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                 )}
               >
                 <item.icon className="w-5 h-5 flex-shrink-0" />
                 {sidebarOpen && <span>{item.label}</span>}
               </button>
             );
           })}
         </nav>
 
         {/* User section */}
         <div className="p-4 border-t border-border">
           <div
             className={cn(
               "flex items-center gap-3",
               !sidebarOpen && "justify-center"
             )}
           >
             <Avatar className="w-10 h-10 border-2 border-primary/20">
               <AvatarFallback className="bg-primary/10 text-primary font-medium">
                 {profile?.full_name ? getInitials(profile.full_name) : "AD"}
               </AvatarFallback>
             </Avatar>
             {sidebarOpen && (
               <div className="flex-1 min-w-0 animate-fade-in">
                 <p className="text-sm font-medium text-foreground truncate">
                   {profile?.full_name || "Admin"}
                 </p>
                 <p className="text-xs text-muted-foreground truncate">
                   {profile?.email}
                 </p>
               </div>
             )}
           </div>
           <Button
             variant="ghost"
             className={cn(
               "w-full mt-3 justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
               !sidebarOpen && "justify-center px-0"
             )}
             onClick={handleSignOut}
           >
             <LogOut className="w-4 h-4" />
             {sidebarOpen && <span className="ml-2">Sign Out</span>}
           </Button>
         </div>
       </aside>
 
       {/* Main content */}
       <div className="flex-1 flex flex-col min-w-0">
         {/* Top bar */}
         <header className="h-16 flex items-center gap-4 px-4 lg:px-8 border-b border-border bg-card/50 backdrop-blur-sm">
           <Button
             variant="ghost"
             size="icon"
             className="lg:hidden"
             onClick={() => setMobileOpen(true)}
           >
             <Menu className="w-5 h-5" />
           </Button>
           <div className="flex-1" />
         </header>
 
         {/* Page content */}
         <main className="flex-1 p-4 lg:p-8 overflow-auto">
           <Outlet />
         </main>
       </div>
     </div>
   );
 }