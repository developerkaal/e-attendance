 import { useEffect, useState } from "react";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase, Class } from "@/lib/supabase";
 import { DataTable } from "@/components/ui/data-table";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
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
 import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 import { format } from "date-fns";
 
 export default function Classes() {
   const { user } = useAuth();
   const { toast } = useToast();
   const [classes, setClasses] = useState<Class[]>([]);
   const [loading, setLoading] = useState(true);
   const [dialogOpen, setDialogOpen] = useState(false);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
   const [selectedClass, setSelectedClass] = useState<Class | null>(null);
   const [formData, setFormData] = useState({ name: "", description: "" });
   const [saving, setSaving] = useState(false);
   const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
 
   useEffect(() => {
     if (user) {
       fetchClasses();
     }
   }, [user]);
 
   const fetchClasses = async () => {
     try {
       const { data, error } = await supabase
         .from("classes")
         .select("*")
         .order("created_at", { ascending: false });
 
       if (error) throw error;
       setClasses(data || []);
 
       // Fetch student counts for each class
       if (data) {
         const counts: Record<string, number> = {};
         for (const cls of data) {
           const { count } = await supabase
             .from("students")
             .select("*", { count: "exact", head: true })
             .eq("class_id", cls.id);
           counts[cls.id] = count || 0;
         }
         setStudentCounts(counts);
       }
     } catch (error) {
       console.error("Error fetching classes:", error);
       toast({
         title: "Error",
         description: "Failed to load classes",
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
       if (selectedClass) {
         const { error } = await supabase
           .from("classes")
           .update({
             name: formData.name,
             description: formData.description || null,
           })
           .eq("id", selectedClass.id);
 
         if (error) throw error;
         toast({ title: "Success", description: "Class updated successfully" });
       } else {
         const { error } = await supabase.from("classes").insert({
           name: formData.name,
           description: formData.description || null,
           created_by: user.id,
         });
 
         if (error) throw error;
         toast({ title: "Success", description: "Class created successfully" });
       }
 
       setDialogOpen(false);
       setSelectedClass(null);
       setFormData({ name: "", description: "" });
       fetchClasses();
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : "Failed to save class";
       toast({ title: "Error", description: message, variant: "destructive" });
     } finally {
       setSaving(false);
     }
   };
 
   const handleDelete = async () => {
     if (!selectedClass) return;
 
     try {
       const { error } = await supabase
         .from("classes")
         .delete()
         .eq("id", selectedClass.id);
 
       if (error) throw error;
       toast({ title: "Success", description: "Class deleted successfully" });
       setDeleteDialogOpen(false);
       setSelectedClass(null);
       fetchClasses();
     } catch (error: unknown) {
       const message = error instanceof Error ? error.message : "Failed to delete class";
       toast({ title: "Error", description: message, variant: "destructive" });
     }
   };
 
   const openEditDialog = (cls: Class) => {
     setSelectedClass(cls);
     setFormData({ name: cls.name, description: cls.description || "" });
     setDialogOpen(true);
   };
 
   const openDeleteDialog = (cls: Class) => {
     setSelectedClass(cls);
     setDeleteDialogOpen(true);
   };
 
   const columns = [
     {
       key: "name",
       header: "Class Name",
       render: (cls: Class) => (
         <span className="font-medium text-foreground">{cls.name}</span>
       ),
     },
     {
       key: "description",
       header: "Description",
       render: (cls: Class) => (
         <span className="text-muted-foreground">{cls.description || "—"}</span>
       ),
     },
     {
       key: "students",
       header: "Students",
       render: (cls: Class) => (
         <div className="flex items-center gap-2 text-muted-foreground">
           <Users className="w-4 h-4" />
           {studentCounts[cls.id] || 0}
         </div>
       ),
     },
     {
       key: "created_at",
       header: "Created",
       render: (cls: Class) => (
         <span className="text-muted-foreground">
           {format(new Date(cls.created_at), "MMM d, yyyy")}
         </span>
       ),
     },
     {
       key: "actions",
       header: "",
       className: "w-24",
       render: (cls: Class) => (
         <div className="flex items-center gap-1">
           <Button
             variant="ghost"
             size="icon"
             onClick={() => openEditDialog(cls)}
             className="h-8 w-8"
           >
             <Pencil className="w-4 h-4" />
           </Button>
           <Button
             variant="ghost"
             size="icon"
             onClick={() => openDeleteDialog(cls)}
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
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-foreground">Classes</h1>
           <p className="text-muted-foreground">Manage your classes and sections</p>
         </div>
         <Button
           onClick={() => {
             setSelectedClass(null);
             setFormData({ name: "", description: "" });
             setDialogOpen(true);
           }}
         >
           <Plus className="w-4 h-4 mr-2" />
           Add Class
         </Button>
       </div>
 
       {/* Table */}
       <DataTable
         data={classes}
         columns={columns}
         searchKey="name"
         searchPlaceholder="Search classes..."
         loading={loading}
         emptyMessage="No classes found. Create your first class to get started."
       />
 
       {/* Create/Edit Dialog */}
       <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>
               {selectedClass ? "Edit Class" : "Create New Class"}
             </DialogTitle>
           </DialogHeader>
           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="name">Class Name</Label>
               <Input
                 id="name"
                 placeholder="e.g., Class 10A, BCA 2nd Sem"
                 value={formData.name}
                 onChange={(e) =>
                   setFormData({ ...formData, name: e.target.value })
                 }
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="description">Description (Optional)</Label>
               <Textarea
                 id="description"
                 placeholder="Enter class description..."
                 value={formData.description}
                 onChange={(e) =>
                   setFormData({ ...formData, description: e.target.value })
                 }
                 rows={3}
               />
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
                 ) : selectedClass ? (
                   "Update Class"
                 ) : (
                   "Create Class"
                 )}
               </Button>
             </DialogFooter>
           </form>
         </DialogContent>
       </Dialog>
 
       {/* Delete Confirmation */}
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Class</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{selectedClass?.name}"? This will
               also delete all students and attendance records in this class. This
               action cannot be undone.
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