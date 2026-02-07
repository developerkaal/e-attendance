 import { cn } from "@/lib/utils";
 import { LucideIcon } from "lucide-react";
 
 interface StatCardProps {
   title: string;
   value: string | number;
   description?: string;
   icon: LucideIcon;
   trend?: {
     value: number;
     positive: boolean;
   };
   variant?: "default" | "primary" | "success" | "warning" | "destructive";
   className?: string;
 }
 
 const variantStyles = {
   default: {
     icon: "bg-muted text-muted-foreground",
     card: "",
   },
   primary: {
     icon: "bg-primary/10 text-primary",
     card: "",
   },
   success: {
     icon: "bg-success/10 text-success",
     card: "",
   },
   warning: {
     icon: "bg-warning/10 text-warning",
     card: "",
   },
   destructive: {
     icon: "bg-destructive/10 text-destructive",
     card: "",
   },
 };
 
 export function StatCard({
   title,
   value,
   description,
   icon: Icon,
   trend,
   variant = "default",
   className,
 }: StatCardProps) {
   const styles = variantStyles[variant];
 
   return (
     <div
       className={cn(
         "bg-card rounded-xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300",
         styles.card,
         className
       )}
     >
       <div className="flex items-start justify-between">
         <div className="space-y-1">
           <p className="text-sm font-medium text-muted-foreground">{title}</p>
           <p className="text-3xl font-bold text-foreground tracking-tight">
             {value}
           </p>
           {description && (
             <p className="text-sm text-muted-foreground">{description}</p>
           )}
           {trend && (
             <p
               className={cn(
                 "text-sm font-medium",
                 trend.positive ? "text-success" : "text-destructive"
               )}
             >
               {trend.positive ? "+" : "-"}
               {Math.abs(trend.value)}%
             </p>
           )}
         </div>
         <div className={cn("p-3 rounded-xl", styles.icon)}>
           <Icon className="w-6 h-6" />
         </div>
       </div>
     </div>
   );
 }