 import { useEffect, useState } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase, Student, Class, Attendance as AttendanceType } from "@/lib/supabase";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Calendar } from "@/components/ui/calendar";
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from "@/components/ui/popover";
 import { CalendarIcon, Check, X, Save, Loader2 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 import { StatusBadge } from "@/components/ui/status-badge";
 
 export default function Attendance() {
   const { user } = useAuth();
   const { toast } = useToast();
   const [classes, setClasses] = useState<Class[]>([]);
   const [students, setStudents] = useState<Student[]>([]);
   const [selectedClass, setSelectedClass] = useState<string>("");
   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
   const [attendance, setAttendance] = useState<Record<string, boolean>>({});
   const [existingRecords, setExistingRecords] = useState<AttendanceType[]>([]);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
 
   useEffect(() => {
     if (user) {
       fetchClasses();
     }
   }, [user]);
 
   useEffect(() => {
     if (selectedClass) {
       fetchStudentsAndAttendance();
     }
   }, [selectedClass, selectedDate]);
 
   const fetchClasses = async () => {
     try {
       const { data, error } = await supabase
         .from("classes")
         .select("*")
         .order("name");
 
       if (error) throw error;
       setClasses(data || []);
       if (data && data.length > 0) {
         setSelectedClass(data[0].id);
       }
     } catch (error) {
       console.error("Error fetching classes:", error);
     } finally {
       setLoading(false);
     }
   };
 
   const fetchStudentsAndAttendance = async () => {
     setLoading(true);
     try {
       const dateStr = format(selectedDate, "yyyy-MM-dd");
 
       const [studentsRes, attendanceRes] = await Promise.all([
         supabase
           .from("students")
           .select("*")
           .eq("class_id", selectedClass)
           .order("roll_no"),
         supabase
           .from("attendance")
           .select("*")
           .eq("class_id", selectedClass)
           .eq("date", dateStr),
       ]);
 
       if (studentsRes.error) throw studentsRes.error;
       if (attendanceRes.error) throw attendanceRes.error;
 
       setStudents(studentsRes.data || []);
       setExistingRecords(attendanceRes.data || []);
 
       // Initialize attendance state
       const attendanceMap: Record<string, boolean> = {};
       (studentsRes.data || []).forEach((student) => {
         const record = attendanceRes.data?.find(
           (a) => a.student_id === student.id
         );
         attendanceMap[student.id] = record?.is_present ?? false;
       });
       setAttendance(attendanceMap);
     } catch (error) {
       console.error("Error fetching data:", error);
       toast({
         title: "Error",
         description: "Failed to load attendance data",
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
   };
 
   const toggleAttendance = (studentId: string) => {
     setAttendance((prev) => ({
       ...prev,
       [studentId]: !prev[studentId],
     }));
   };
 
   const markAll = (present: boolean) => {
     const updated: Record<string, boolean> = {};
     students.forEach((student) => {
       updated[student.id] = present;
     });
     setAttendance(updated);
   };
 
   const saveAttendance = async () => {
     if (!user || !selectedClass) return;
 
     setSaving(true);
     try {
       const dateStr = format(selectedDate, "yyyy-MM-dd");
       const records = students.map((student) => ({
         student_id: student.id,
         class_id: selectedClass,
         date: dateStr,
         is_present: attendance[student.id] ?? false,
         marked_by: user.id,
       }));
 
       // Delete existing records for this class and date
       if (existingRecords.length > 0) {
         // Log changes for audit
         const changes = existingRecords.map((existing) => {
           const newStatus = attendance[existing.student_id] ?? false;
           return {
             attendance_id: existing.id,
             previous_status: existing.is_present,
             new_status: newStatus,
             changed_by: user.id,
           };
         }).filter((c) => c.previous_status !== c.new_status);
 
         if (changes.length > 0) {
           await supabase.from("attendance_log").insert(changes);
         }
 
         await supabase
           .from("attendance")
           .delete()
           .eq("class_id", selectedClass)
           .eq("date", dateStr);
       }
 
       const { error } = await supabase.from("attendance").insert(records);
       if (error) throw error;
 
       toast({
         title: "Success",
         description: "Attendance saved successfully",
       });
 
       fetchStudentsAndAttendance();
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : "Failed to save attendance";
       toast({ title: "Error", description: message, variant: "destructive" });
     } finally {
       setSaving(false);
     }
   };
 
   const presentCount = Object.values(attendance).filter(Boolean).length;
   const absentCount = students.length - presentCount;
 
   return (
     <div className="space-y-6 animate-fade-in">
       {/* Header */}
       <div>
         <h1 className="text-2xl font-bold text-foreground">Mark Attendance</h1>
         <p className="text-muted-foreground">
           Select a class and date to mark attendance
         </p>
       </div>
 
       {/* Controls */}
       <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 bg-card p-4 rounded-xl border border-border">
         <div className="space-y-2">
           <Label>Class</Label>
           <Select value={selectedClass} onValueChange={setSelectedClass}>
             <SelectTrigger className="w-48">
               <SelectValue placeholder="Select class" />
             </SelectTrigger>
             <SelectContent>
               {classes.map((cls) => (
                 <SelectItem key={cls.id} value={cls.id}>
                   {cls.name}
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         <div className="space-y-2">
           <Label>Date</Label>
           <Popover>
             <PopoverTrigger asChild>
               <Button
                 variant="outline"
                 className="w-48 justify-start text-left font-normal"
               >
                 <CalendarIcon className="mr-2 h-4 w-4" />
                 {format(selectedDate, "PPP")}
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-auto p-0" align="start">
               <Calendar
                 mode="single"
                 selected={selectedDate}
                 onSelect={(date) => date && setSelectedDate(date)}
                 initialFocus
                 className="pointer-events-auto"
               />
             </PopoverContent>
           </Popover>
         </div>
 
         <div className="flex items-center gap-2 ml-auto">
           <Button
             variant="outline"
             size="sm"
             onClick={() => markAll(true)}
             disabled={students.length === 0}
           >
             <Check className="w-4 h-4 mr-1" />
             Mark All Present
           </Button>
           <Button
             variant="outline"
             size="sm"
             onClick={() => markAll(false)}
             disabled={students.length === 0}
           >
             <X className="w-4 h-4 mr-1" />
             Mark All Absent
           </Button>
         </div>
       </div>
 
       {/* Stats */}
       {students.length > 0 && (
         <div className="flex items-center gap-4">
           <StatusBadge status="present">
             Present: {presentCount}
           </StatusBadge>
           <StatusBadge status="absent">
             Absent: {absentCount}
           </StatusBadge>
           <span className="text-sm text-muted-foreground">
             Total: {students.length}
           </span>
         </div>
       )}
 
       {/* Attendance Grid */}
       {loading ? (
         <div className="flex items-center justify-center h-64">
           <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
         </div>
       ) : classes.length === 0 ? (
         <div className="text-center py-12 bg-card rounded-xl border border-border">
           <p className="text-muted-foreground mb-4">
             You need to create a class first.
           </p>
           <Button onClick={() => (window.location.href = "/classes")}>
             Go to Classes
           </Button>
         </div>
       ) : students.length === 0 ? (
         <div className="text-center py-12 bg-card rounded-xl border border-border">
           <p className="text-muted-foreground mb-4">
             No students in this class yet.
           </p>
           <Button onClick={() => (window.location.href = "/students")}>
             Add Students
           </Button>
         </div>
       ) : (
         <div className="bg-card rounded-xl border border-border overflow-hidden">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
             {students.map((student) => {
               const isPresent = attendance[student.id];
               return (
                 <button
                   key={student.id}
                   onClick={() => toggleAttendance(student.id)}
                   className={cn(
                     "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                     isPresent
                       ? "bg-success/10 border-success/30 hover:border-success/50"
                       : "bg-destructive/5 border-destructive/20 hover:border-destructive/40"
                   )}
                 >
                   <div
                     className={cn(
                       "w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm",
                       isPresent
                         ? "bg-success text-success-foreground"
                         : "bg-destructive text-destructive-foreground"
                     )}
                   >
                     {isPresent ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                   </div>
                   <div className="flex-1 text-left">
                     <p className="font-medium text-foreground text-sm">
                       {student.full_name}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       Roll: {student.roll_no}
                     </p>
                   </div>
                 </button>
               );
             })}
           </div>
 
           {/* Save Button */}
           <div className="px-4 py-3 bg-muted/30 border-t border-border flex justify-end">
             <Button onClick={saveAttendance} disabled={saving}>
               {saving ? (
                 <Loader2 className="w-4 h-4 animate-spin mr-2" />
               ) : (
                 <Save className="w-4 h-4 mr-2" />
               )}
               Save Attendance
             </Button>
           </div>
         </div>
       )}
     </div>
   );
 }