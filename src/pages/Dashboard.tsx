 import { useEffect, useState } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/lib/supabase";
 import { StatCard } from "@/components/ui/stat-card";
 import { StatusBadge } from "@/components/ui/status-badge";
 import { Users, GraduationCap, ClipboardCheck, TrendingUp } from "lucide-react";
 import { format } from "date-fns";
 
 export default function Dashboard() {
   const { user, profile } = useAuth();
   const [stats, setStats] = useState({
     totalStudents: 0,
     totalClasses: 0,
     todayAttendance: 0,
     overallAttendance: 0,
   });
   const [recentAttendance, setRecentAttendance] = useState<
     Array<{
       class_name: string;
       date: string;
       present: number;
       total: number;
     }>
   >([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (user) {
       fetchDashboardData();
     }
   }, [user]);
 
   const fetchDashboardData = async () => {
     try {
       // Fetch total classes
       const { count: classCount } = await supabase
         .from("classes")
         .select("*", { count: "exact", head: true });
 
       // Fetch total students
       const { count: studentCount } = await supabase
         .from("students")
         .select("*", { count: "exact", head: true });
 
       // Fetch today's attendance
       const today = format(new Date(), "yyyy-MM-dd");
       const { data: todayData } = await supabase
         .from("attendance")
         .select("is_present")
         .eq("date", today);
 
       const todayPresent = todayData?.filter((a) => a.is_present).length || 0;
       const todayTotal = todayData?.length || 0;
       const todayPercentage = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;
 
       // Fetch overall attendance
       const { data: allAttendance } = await supabase
         .from("attendance")
         .select("is_present");
 
       const totalPresent = allAttendance?.filter((a) => a.is_present).length || 0;
       const totalRecords = allAttendance?.length || 0;
       const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
 
       setStats({
         totalStudents: studentCount || 0,
         totalClasses: classCount || 0,
         todayAttendance: todayPercentage,
         overallAttendance: overallPercentage,
       });
 
       // Fetch recent attendance by class
       const { data: classes } = await supabase.from("classes").select("id, name").limit(5);
 
       if (classes) {
         const recentData = await Promise.all(
           classes.map(async (cls) => {
             const { data: attendance } = await supabase
               .from("attendance")
               .select("is_present, date")
               .eq("class_id", cls.id)
               .order("date", { ascending: false })
               .limit(50);
 
             const present = attendance?.filter((a) => a.is_present).length || 0;
             const total = attendance?.length || 0;
             const lastDate = attendance?.[0]?.date || today;
 
             return {
               class_name: cls.name,
               date: lastDate,
               present,
               total,
             };
           })
         );
         setRecentAttendance(recentData.filter((r) => r.total > 0));
       }
     } catch (error) {
       console.error("Error fetching dashboard data:", error);
     } finally {
       setLoading(false);
     }
   };
 
   const getAttendanceStatus = (percentage: number): "present" | "warning" | "absent" => {
     if (percentage >= 75) return "present";
     if (percentage >= 50) return "warning";
     return "absent";
   };
 
   return (
     <div className="space-y-8 animate-fade-in">
       {/* Header */}
       <div>
         <h1 className="text-3xl font-bold text-foreground">
           Welcome back, {profile?.full_name?.split(" ")[0] || "Admin"}!
         </h1>
         <p className="text-muted-foreground mt-1">
           Here's an overview of your attendance management system.
         </p>
       </div>
 
       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard
           title="Total Students"
           value={stats.totalStudents}
           icon={Users}
           variant="primary"
         />
         <StatCard
           title="Total Classes"
           value={stats.totalClasses}
           icon={GraduationCap}
           variant="success"
         />
         <StatCard
           title="Today's Attendance"
           value={`${stats.todayAttendance}%`}
           icon={ClipboardCheck}
           variant={stats.todayAttendance >= 75 ? "success" : stats.todayAttendance >= 50 ? "warning" : "destructive"}
         />
         <StatCard
           title="Overall Attendance"
           value={`${stats.overallAttendance}%`}
           icon={TrendingUp}
           variant={stats.overallAttendance >= 75 ? "success" : stats.overallAttendance >= 50 ? "warning" : "destructive"}
         />
       </div>
 
       {/* Recent Activity */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Class Attendance Summary */}
         <div className="bg-card rounded-xl border border-border p-6 shadow-card">
           <h2 className="text-lg font-semibold text-foreground mb-4">
             Class Attendance Overview
           </h2>
           {loading ? (
             <div className="flex items-center justify-center h-40">
               <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
             </div>
           ) : recentAttendance.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
               <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
               <p>No attendance data yet</p>
               <p className="text-sm">Start marking attendance to see stats here</p>
             </div>
           ) : (
             <div className="space-y-4">
               {recentAttendance.map((item, index) => {
                 const percentage = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
                 return (
                   <div
                     key={index}
                     className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                   >
                     <div>
                       <p className="font-medium text-foreground">{item.class_name}</p>
                       <p className="text-sm text-muted-foreground">
                         {item.present}/{item.total} present
                       </p>
                     </div>
                     <StatusBadge status={getAttendanceStatus(percentage)}>
                       {percentage}%
                     </StatusBadge>
                   </div>
                 );
               })}
             </div>
           )}
         </div>
 
         {/* Quick Actions */}
         <div className="bg-card rounded-xl border border-border p-6 shadow-card">
           <h2 className="text-lg font-semibold text-foreground mb-4">
             Quick Actions
           </h2>
           <div className="grid grid-cols-2 gap-4">
             <a
               href="/attendance"
               className="flex flex-col items-center p-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all duration-200 group"
             >
               <ClipboardCheck className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
               <span className="font-medium text-foreground">Mark Attendance</span>
             </a>
             <a
               href="/students"
               className="flex flex-col items-center p-4 rounded-xl bg-success/5 hover:bg-success/10 border border-success/10 transition-all duration-200 group"
             >
               <Users className="w-8 h-8 text-success mb-2 group-hover:scale-110 transition-transform" />
               <span className="font-medium text-foreground">Add Student</span>
             </a>
             <a
               href="/classes"
               className="flex flex-col items-center p-4 rounded-xl bg-warning/5 hover:bg-warning/10 border border-warning/10 transition-all duration-200 group"
             >
               <GraduationCap className="w-8 h-8 text-warning mb-2 group-hover:scale-110 transition-transform" />
               <span className="font-medium text-foreground">Add Class</span>
             </a>
             <a
               href="/reports"
               className="flex flex-col items-center p-4 rounded-xl bg-accent hover:bg-accent/80 border border-border transition-all duration-200 group"
             >
               <TrendingUp className="w-8 h-8 text-accent-foreground mb-2 group-hover:scale-110 transition-transform" />
               <span className="font-medium text-foreground">View Reports</span>
             </a>
           </div>
         </div>
       </div>
     </div>
   );
 }