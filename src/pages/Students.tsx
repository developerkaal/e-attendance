 import { useEffect, useState } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase, Student, Class } from "@/lib/supabase";
 import { DataTable } from "@/components/ui/data-table";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
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
 import { Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { Badge } from "@/components/ui/badge";
 
 export default function Students() {
   const { user } = useAuth();
   const { toast } = useToast();
   const [students, setStudents] = useState<Student[]>([]);
   const [classes, setClasses] = useState<Class[]>([]);
   const [loading, setLoading] = useState(true);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
   const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
   const [filterClassId, setFilterClassId] = useState<string>("all");
   const [formData, setFormData] = useState({
     roll_no: "",
     full_name: "",
     class_id: "",
     email: "",
     phone: "",
   });
   const [saving, setSaving] = useState(false);
   const [csvData, setCsvData] = useState("");
 
   useEffect(() => {
     if (user) {
       fetchData();
     }
   }, [user]);
 
   const fetchData = async () => {
     try {
       const [studentsRes, classesRes] = await Promise.all([
         supabase
           .from("students")
           .select("*, classes(id, name)")
           .order("roll_no", { ascending: true }),
         supabase.from("classes").select("*").order("name"),
       ]);
 
       if (studentsRes.error) throw studentsRes.error;
       if (classesRes.error) throw classesRes.error;
 
       setStudents(studentsRes.data || []);
       setClasses(classesRes.data || []);
     } catch (error) {
       console.error("Error fetching data:", error);
       toast({
         title: "Error",
         description: "Failed to load data",
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
 
     setSaving(true);
     try {
       if (selectedStudent) {
         const { error } = await supabase
           .from("students")
           .update({
             roll_no: formData.roll_no,
             full_name: formData.full_name,
             class_id: formData.class_id,
             email: formData.email || null,
             phone: formData.phone || null,
           })
           .eq("id", selectedStudent.id);
 
         if (error) throw error;
         toast({ title: "Success", description: "Student updated successfully" });
       } else {
         const { error } = await supabase.from("students").insert({
           roll_no: formData.roll_no,
           full_name: formData.full_name,
           class_id: formData.class_id,
           email: formData.email || null,
           phone: formData.phone || null,
           created_by: user.id,
         });
 
         if (error) throw error;
         toast({ title: "Success", description: "Student added successfully" });
       }
 
       setDialogOpen(false);
       setSelectedStudent(null);
       setFormData({ roll_no: "", full_name: "", class_id: "", email: "", phone: "" });
       fetchData();
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : "Failed to save student";
       toast({ title: "Error", description: message, variant: "destructive" });
     } finally {
       setSaving(false);
     }
   };
 
   const handleDelete = async () => {
     if (!selectedStudent) return;
 
     try {
       const { error } = await supabase
         .from("students")
         .delete()
         .eq("id", selectedStudent.id);
 
       if (error) throw error;
       toast({ title: "Success", description: "Student deleted successfully" });
       setDeleteDialogOpen(false);
       setSelectedStudent(null);
       fetchData();
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : "Failed to delete student";
       toast({ title: "Error", description: message, variant: "destructive" });
     }
   };
 
   const handleBulkUpload = async () => {
     if (!user || !csvData.trim()) return;
 
     setSaving(true);
     try {
       const lines = csvData.trim().split("\n").slice(1); // Skip header
       const studentsToInsert = lines.map((line) => {
         const [roll_no, full_name, class_name, email, phone] = line
           .split(",")
           .map((s) => s.trim());
         const classMatch = classes.find(
           (c) => c.name.toLowerCase() === class_name.toLowerCase()
         );
         return {
           roll_no,
           full_name,
           class_id: classMatch?.id || "",
           email: email || null,
           phone: phone || null,
           created_by: user.id,
         };
       });
 
       const validStudents = studentsToInsert.filter((s) => s.class_id && s.roll_no && s.full_name);
 
       if (validStudents.length === 0) {
         throw new Error("No valid students found. Make sure class names match exactly.");
       }
 
       const { error } = await supabase.from("students").insert(validStudents);
       if (error) throw error;
 
       toast({
         title: "Success",
         description: `${validStudents.length} students imported successfully`,
       });
       setUploadDialogOpen(false);
       setCsvData("");
       fetchData();
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : "Failed to import students";
       toast({ title: "Error", description: message, variant: "destructive" });
     } finally {
       setSaving(false);
     }
   };
 
   const openEditDialog = (student: Student) => {
     setSelectedStudent(student);
     setFormData({
       roll_no: student.roll_no,
       full_name: student.full_name,
       class_id: student.class_id,
       email: student.email || "",
       phone: student.phone || "",
     });
     setDialogOpen(true);
   };
 
   const filteredStudents = filterClassId === "all"
     ? students
     : students.filter((s) => s.class_id === filterClassId);
 
   const columns = [
     {
       key: "roll_no",
       header: "Roll No",
       render: (student: Student) => (
         <span className="font-medium text-foreground">{student.roll_no}</span>
       ),
     },
     {
       key: "full_name",
       header: "Name",
       render: (student: Student) => (
         <span className="text-foreground">{student.full_name}</span>
       ),
     },
     {
       key: "class",
       header: "Class",
       render: (student: Student) => (
         <Badge variant="secondary">
           {student.classes?.name || "—"}
         </Badge>
       ),
     },
     {
       key: "email",
       header: "Email",
       render: (student: Student) => (
         <span className="text-muted-foreground">{student.email || "—"}</span>
       ),
     },
     {
       key: "phone",
       header: "Phone",
       render: (student: Student) => (
         <span className="text-muted-foreground">{student.phone || "—"}</span>
       ),
     },
     {
       key: "actions",
       header: "",
       className: "w-24",
       render: (student: Student) => (
         <div className="flex items-center gap-1">
           <Button
             variant="ghost"
             size="icon"
             onClick={() => openEditDialog(student)}
             className="h-8 w-8"
           >
             <Pencil className="w-4 h-4" />
           </Button>
           <Button
             variant="ghost"
             size="icon"
             onClick={() => {
               setSelectedStudent(student);
               setDeleteDialogOpen(true);
             }}
             className="h-8 w-8 text-destructive hover:text-destructive"
           >
             <Trash2 className="w-4 h-4" />
           </Button>
         </div>
       ),
     },
   ];
 
   return (
     <div className="space-y-6 animate-fade-in">
       {/* Header */}
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div>
           <h1 className="text-2xl font-bold text-foreground">Students</h1>
           <p className="text-muted-foreground">Manage student records</p>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
             <Upload className="w-4 h-4 mr-2" />
             Bulk Upload
           </Button>
           <Button
             onClick={() => {
               setSelectedStudent(null);
               setFormData({
                 roll_no: "",
                 full_name: "",
                 class_id: classes[0]?.id || "",
                 email: "",
                 phone: "",
               });
               setDialogOpen(true);
             }}
             disabled={classes.length === 0}
           >
             <Plus className="w-4 h-4 mr-2" />
             Add Student
           </Button>
         </div>
       </div>
 
       {/* Filter */}
       {classes.length > 0 && (
         <div className="flex items-center gap-4">
           <Label className="text-muted-foreground">Filter by class:</Label>
           <Select value={filterClassId} onValueChange={setFilterClassId}>
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
       )}
 
       {/* Table */}
       {classes.length === 0 && !loading ? (
         <div className="text-center py-12 bg-card rounded-xl border border-border">
           <p className="text-muted-foreground mb-4">
             You need to create a class before adding students.
           </p>
           <Button onClick={() => window.location.href = "/classes"}>
             Go to Classes
           </Button>
         </div>
       ) : (
         <DataTable
           data={filteredStudents}
           columns={columns}
           searchKey="full_name"
           searchPlaceholder="Search students..."
           loading={loading}
           emptyMessage="No students found. Add your first student to get started."
         />
       )}
 
       {/* Add/Edit Dialog */}
       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>
               {selectedStudent ? "Edit Student" : "Add New Student"}
             </DialogTitle>
           </DialogHeader>
           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="roll_no">Roll No</Label>
                 <Input
                   id="roll_no"
                   placeholder="e.g., 001"
                   value={formData.roll_no}
                   onChange={(e) =>
                     setFormData({ ...formData, roll_no: e.target.value })
                   }
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="class">Class</Label>
                 <Select
                   value={formData.class_id}
                   onValueChange={(v) =>
                     setFormData({ ...formData, class_id: v })
                   }
                 >
                   <SelectTrigger>
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
             </div>
             <div className="space-y-2">
               <Label htmlFor="full_name">Full Name</Label>
               <Input
                 id="full_name"
                 placeholder="Enter student name"
                 value={formData.full_name}
                 onChange={(e) =>
                   setFormData({ ...formData, full_name: e.target.value })
                 }
                 required
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="email">Email (Optional)</Label>
                 <Input
                   id="email"
                   type="email"
                   placeholder="student@email.com"
                   value={formData.email}
                   onChange={(e) =>
                     setFormData({ ...formData, email: e.target.value })
                   }
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="phone">Phone (Optional)</Label>
                 <Input
                   id="phone"
                   placeholder="+91 XXXXX XXXXX"
                   value={formData.phone}
                   onChange={(e) =>
                     setFormData({ ...formData, phone: e.target.value })
                   }
                 />
               </div>
             </div>
             <DialogFooter>
               <Button
                 type="button"
                 variant="outline"
                 onClick={() => setDialogOpen(false)}
               >
                 Cancel
               </Button>
               <Button type="submit" disabled={saving}>
                 {saving ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : selectedStudent ? (
                   "Update Student"
                 ) : (
                   "Add Student"
                 )}
               </Button>
             </DialogFooter>
           </form>
         </DialogContent>
       </Dialog>
 
       {/* Bulk Upload Dialog */}
       <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
         <DialogContent className="max-w-lg">
           <DialogHeader>
             <DialogTitle>Bulk Upload Students</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
               Paste CSV data with the following format:
             </p>
             <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
               roll_no,full_name,class_name,email,phone{"\n"}
               001,John Doe,Class 10A,john@email.com,+91 12345{"\n"}
               002,Jane Smith,Class 10A,,
             </pre>
             <textarea
               className="w-full h-40 p-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
               placeholder="Paste CSV data here..."
               value={csvData}
               onChange={(e) => setCsvData(e.target.value)}
             />
           </div>
           <DialogFooter>
             <Button
               variant="outline"
               onClick={() => setUploadDialogOpen(false)}
             >
               Cancel
             </Button>
             <Button onClick={handleBulkUpload} disabled={saving || !csvData.trim()}>
               {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
 
       {/* Delete Confirmation */}
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Student</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{selectedStudent?.full_name}"?
               This will also delete all attendance records for this student.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleDelete}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }