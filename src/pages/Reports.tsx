 import { useEffect, useState } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase, Class, Student } from "@/lib/supabase";
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
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { DataTable } from "@/components/ui/data-table";
 import { StatusBadge } from "@/components/ui/status-badge";
 import { CalendarIcon, Download, FileSpreadsheet, Users } from "lucide-react";
 import { format } from "date-fns";
 import { cn } from "@/lib/utils";
 
 type StudentReport = {
   id: string;
   roll_no: string;
   full_name: string;
   class_name: string;
   total_days: number;
   present_days: number;
   absent_days: number;
   percentage: number;
 };
 
 type DateReport = {
   student_id: string;
   roll_no: string;
   full_name: string;
   is_present: boolean;
 };
 
 export default function Reports() {
   const { user } = useAuth();
   const [classes, setClasses] = useState<Class[]>([]);
   const [students, setStudents] = useState<Student[]>([]);
   const [selectedClass, setSelectedClass] = useState<string>("all");
   const [selectedStudent, setSelectedStudent] = useState<string>("all");
   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
   const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
   const [dateReports, setDateReports] = useState<DateReport[]>([]);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState("student");
 
   useEffect(() => {
     if (user) {
       fetchInitialData();
     }
   }, [user]);
 
   useEffect(() => {
     if (activeTab === "student") {
       fetchStudentReports();
     } else if (activeTab === "date") {
       fetchDateReports();
     } else if (activeTab === "class") {
       fetchStudentReports();
     }
   }, [activeTab, selectedClass, selectedStudent, selectedDate]);
 
   const fetchInitialData = async () => {
     try {
       const [classesRes, studentsRes] = await Promise.all([
         supabase.from("classes").select("*").order("name"),
         supabase.from("students").select("*, classes(id, name)").order("full_name"),
       ]);
 
       setClasses(classesRes.data || []);
       setStudents(studentsRes.data || []);
     } catch (error) {
       console.error("Error fetching data:", error);
     } finally {
       setLoading(false);
     }
   };
 
   const fetchStudentReports = async () => {
     setLoading(true);
     try {
       let studentsQuery = supabase
         .from("students")
         .select("*, classes(id, name)")
         .order("roll_no");
 
       if (selectedClass !== "all") {
         studentsQuery = studentsQuery.eq("class_id", selectedClass);
       }
       if (selectedStudent !== "all") {
         studentsQuery = studentsQuery.eq("id", selectedStudent);
       }
 
       const { data: studentsData } = await studentsQuery;
 
       const reports: StudentReport[] = await Promise.all(
         (studentsData || []).map(async (student) => {
           const { data: attendance } = await supabase
             .from("attendance")
             .select("is_present")
             .eq("student_id", student.id);
 
           const total = attendance?.length || 0;
           const present = attendance?.filter((a) => a.is_present).length || 0;
           const absent = total - present;
           const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
 
           return {
             id: student.id,
             roll_no: student.roll_no,
             full_name: student.full_name,
             class_name: student.classes?.name || "—",
             total_days: total,
             present_days: present,
             absent_days: absent,
             percentage,
           };
         })
       );
 
       setStudentReports(reports);
     } catch (error) {
       console.error("Error fetching reports:", error);
     } finally {
       setLoading(false);
     }
   };
 
   const fetchDateReports = async () => {
     if (selectedClass === "all") return;
 
     setLoading(true);
     try {
       const dateStr = format(selectedDate, "yyyy-MM-dd");
 
       const { data } = await supabase
         .from("attendance")
         .select("student_id, is_present, students(id, roll_no, full_name)")
         .eq("class_id", selectedClass)
         .eq("date", dateStr);
 
       const reports: DateReport[] = (data || []).map((record) => ({
         student_id: record.student_id,
         roll_no: record.students?.roll_no || "",
         full_name: record.students?.full_name || "",
         is_present: record.is_present,
       }));
 
       setDateReports(reports.sort((a, b) => a.roll_no.localeCompare(b.roll_no)));
     } catch (error) {
       console.error("Error fetching date reports:", error);
     } finally {
       setLoading(false);
     }
   };
 
   const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
     if (data.length === 0) return;
 
     const headers = Object.keys(data[0]);
     const csvContent = [
       headers.join(","),
       ...data.map((row) =>
         headers.map((h) => `"${row[h] ?? ""}"`).join(",")
       ),
     ].join("\n");
 
     const blob = new Blob([csvContent], { type: "text/csv" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = `${filename}.csv`;
     a.click();
     URL.revokeObjectURL(url);
   };
 
   const getAttendanceStatus = (percentage: number): "present" | "warning" | "absent" => {
     if (percentage >= 75) return "present";
     if (percentage >= 50) return "warning";
     return "absent";
   };
 
   const studentColumns = [
     {
       key: "roll_no",
       header: "Roll No",
       render: (report: StudentReport) => (
         <span className="font-medium">{report.roll_no}</span>
       ),
     },
     { key: "full_name", header: "Name" },
     { key: "class_name", header: "Class" },
     {
       key: "present_days",
       header: "Present",
       render: (report: StudentReport) => (
         <span className="text-success font-medium">{report.present_days}</span>
       ),
     },
     {
       key: "absent_days",
       header: "Absent",
       render: (report: StudentReport) => (
         <span className="text-destructive font-medium">{report.absent_days}</span>
       ),
     },
     {
       key: "total_days",
       header: "Total Days",
     },
     {
       key: "percentage",
       header: "Attendance %",
       render: (report: StudentReport) => (
         <StatusBadge status={getAttendanceStatus(report.percentage)}>
           {report.percentage}%
         </StatusBadge>
       ),
     },
   ];
 
   const dateColumns = [
     {
       key: "roll_no",
       header: "Roll No",
       render: (report: DateReport) => (
         <span className="font-medium">{report.roll_no}</span>
       ),
     },
     { key: "full_name", header: "Name" },
     {
       key: "is_present",
       header: "Status",
       render: (report: DateReport) => (
         <StatusBadge status={report.is_present ? "present" : "absent"}>
           {report.is_present ? "Present" : "Absent"}
         </StatusBadge>
       ),
     },
   ];
 
   const presentToday = dateReports.filter((r) => r.is_present).length;
   const absentToday = dateReports.length - presentToday;
 
   return (
     <div className="space-y-6 animate-fade-in">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-foreground">Reports</h1>
           <p className="text-muted-foreground">
             View and export attendance reports
           </p>
         </div>
       </div>
 
       {/* Tabs */}
       <Tabs value={activeTab} onValueChange={setActiveTab}>
         <TabsList className="grid w-full max-w-md grid-cols-3">
           <TabsTrigger value="student">Student-wise</TabsTrigger>
           <TabsTrigger value="class">Class-wise</TabsTrigger>
           <TabsTrigger value="date">Date-wise</TabsTrigger>
         </TabsList>
 
         {/* Student-wise Report */}
         <TabsContent value="student" className="space-y-4">
           <div className="flex flex-wrap items-end gap-4 bg-card p-4 rounded-xl border border-border">
             <div className="space-y-2">
               <Label>Filter by Class</Label>
               <Select value={selectedClass} onValueChange={setSelectedClass}>
                 <SelectTrigger className="w-48">
                   <SelectValue placeholder="All classes" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Classes</SelectItem>
                   {classes.map((cls) => (
                     <SelectItem key={cls.id} value={cls.id}>
                       {cls.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Filter by Student</Label>
               <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                 <SelectTrigger className="w-48">
                   <SelectValue placeholder="All students" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Students</SelectItem>
                   {students
                     .filter(
                       (s) => selectedClass === "all" || s.class_id === selectedClass
                     )
                     .map((student) => (
                       <SelectItem key={student.id} value={student.id}>
                         {student.full_name}
                       </SelectItem>
                     ))}
                 </SelectContent>
               </Select>
             </div>
             <Button
               variant="outline"
               onClick={() => exportToCSV(studentReports, "student-attendance-report")}
               disabled={studentReports.length === 0}
             >
               <Download className="w-4 h-4 mr-2" />
               Export CSV
             </Button>
           </div>
 
           <DataTable
             data={studentReports}
             columns={studentColumns}
             searchKey="full_name"
             searchPlaceholder="Search students..."
             loading={loading}
             emptyMessage="No attendance data found"
           />
         </TabsContent>
 
         {/* Class-wise Report */}
         <TabsContent value="class" className="space-y-4">
           <div className="flex flex-wrap items-end gap-4 bg-card p-4 rounded-xl border border-border">
             <div className="space-y-2">
               <Label>Select Class</Label>
               <Select
                 value={selectedClass}
                 onValueChange={(v) => {
                   setSelectedClass(v);
                   setSelectedStudent("all");
                 }}
               >
                 <SelectTrigger className="w-48">
                   <SelectValue placeholder="Select class" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Classes</SelectItem>
                   {classes.map((cls) => (
                     <SelectItem key={cls.id} value={cls.id}>
                       {cls.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <Button
               variant="outline"
               onClick={() =>
                 exportToCSV(
                   studentReports.filter(
                     (r) =>
                       selectedClass === "all" ||
                       classes.find((c) => c.id === selectedClass)?.name === r.class_name
                   ),
                   "class-attendance-report"
                 )
               }
               disabled={studentReports.length === 0}
             >
               <Download className="w-4 h-4 mr-2" />
               Export CSV
             </Button>
           </div>
 
           {/* Class Summary Cards */}
           {selectedClass === "all" ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {classes.map((cls) => {
                 const classStudents = studentReports.filter(
                   (r) => r.class_name === cls.name
                 );
                 const avgAttendance =
                   classStudents.length > 0
                     ? Math.round(
                         classStudents.reduce((acc, r) => acc + r.percentage, 0) /
                           classStudents.length
                       )
                     : 0;
 
                 return (
                   <div
                     key={cls.id}
                     className="bg-card rounded-xl border border-border p-5 hover:shadow-card-hover transition-shadow cursor-pointer"
                     onClick={() => setSelectedClass(cls.id)}
                   >
                     <div className="flex items-center gap-3 mb-3">
                       <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                         <Users className="w-5 h-5 text-primary" />
                       </div>
                       <div>
                         <h3 className="font-semibold text-foreground">
                           {cls.name}
                         </h3>
                         <p className="text-xs text-muted-foreground">
                           {classStudents.length} students
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm text-muted-foreground">
                         Avg Attendance
                       </span>
                       <StatusBadge status={getAttendanceStatus(avgAttendance)}>
                         {avgAttendance}%
                       </StatusBadge>
                     </div>
                   </div>
                 );
               })}
             </div>
           ) : (
             <DataTable
               data={studentReports.filter(
                 (r) =>
                   classes.find((c) => c.id === selectedClass)?.name === r.class_name
               )}
               columns={studentColumns}
               searchKey="full_name"
               searchPlaceholder="Search students..."
               loading={loading}
               emptyMessage="No students in this class"
             />
           )}
         </TabsContent>
 
         {/* Date-wise Report */}
         <TabsContent value="date" className="space-y-4">
           <div className="flex flex-wrap items-end gap-4 bg-card p-4 rounded-xl border border-border">
             <div className="space-y-2">
               <Label>Select Class</Label>
               <Select
                 value={selectedClass === "all" ? "" : selectedClass}
                 onValueChange={setSelectedClass}
               >
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
               <Label>Select Date</Label>
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
             <Button
               variant="outline"
               onClick={() =>
                 exportToCSV(
                   dateReports.map((r) => ({
                     ...r,
                     status: r.is_present ? "Present" : "Absent",
                   })),
                   `attendance-${format(selectedDate, "yyyy-MM-dd")}`
                 )
               }
               disabled={dateReports.length === 0}
             >
               <Download className="w-4 h-4 mr-2" />
               Export CSV
             </Button>
           </div>
 
           {selectedClass && selectedClass !== "all" && dateReports.length > 0 && (
             <div className="flex items-center gap-4">
               <StatusBadge status="present">Present: {presentToday}</StatusBadge>
               <StatusBadge status="absent">Absent: {absentToday}</StatusBadge>
               <span className="text-sm text-muted-foreground">
                 Total: {dateReports.length}
               </span>
             </div>
           )}
 
           {!selectedClass || selectedClass === "all" ? (
             <div className="text-center py-12 bg-card rounded-xl border border-border">
               <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
               <p className="text-muted-foreground">
                 Select a class to view date-wise attendance
               </p>
             </div>
           ) : (
             <DataTable
               data={dateReports}
               columns={dateColumns}
               searchKey="full_name"
               searchPlaceholder="Search students..."
               loading={loading}
               emptyMessage={`No attendance recorded for ${format(selectedDate, "PPP")}`}
             />
           )}
         </TabsContent>
       </Tabs>
     </div>
   );
 }