 import { cn } from "@/lib/utils";
 
 interface StatusBadgeProps {
   status: "present" | "absent" | "warning";
   children: React.ReactNode;
   className?: string;
 }
 
 const statusStyles = {
   present: "bg-success/10 text-success border-success/20",
   absent: "bg-destructive/10 text-destructive border-destructive/20",
   warning: "bg-warning/10 text-warning border-warning/20",
 };
 
 export function StatusBadge({ status, children, className }: StatusBadgeProps) {
   return (
     <span
       className={cn(
         "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
         statusStyles[status],
         className
       )}
     >
       {children}
     </span>
   );
 }