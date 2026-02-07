 import { useState } from "react";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { Search, ChevronLeft, ChevronRight } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface Column<T> {
   key: string;
   header: string;
   render?: (item: T) => React.ReactNode;
   className?: string;
 }
 
 interface DataTableProps<T> {
   data: T[];
   columns: Column<T>[];
   searchKey?: string;
   searchPlaceholder?: string;
   pageSize?: number;
   emptyMessage?: string;
   loading?: boolean;
 }
 
 export function DataTable<T extends Record<string, unknown>>({
   data,
   columns,
   searchKey,
   searchPlaceholder = "Search...",
   pageSize = 10,
   emptyMessage = "No data found",
   loading = false,
 }: DataTableProps<T>) {
   const [search, setSearch] = useState("");
   const [page, setPage] = useState(0);
 
   const filteredData = searchKey
     ? data.filter((item) => {
         const value = item[searchKey];
         if (typeof value === "string") {
           return value.toLowerCase().includes(search.toLowerCase());
         }
         return true;
       })
     : data;
 
   const totalPages = Math.ceil(filteredData.length / pageSize);
   const paginatedData = filteredData.slice(
     page * pageSize,
     (page + 1) * pageSize
   );
 
   return (
     <div className="space-y-4">
       {searchKey && (
         <div className="relative max-w-sm">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
           <Input
             placeholder={searchPlaceholder}
             value={search}
             onChange={(e) => {
               setSearch(e.target.value);
               setPage(0);
             }}
             className="pl-10"
           />
         </div>
       )}
 
       <div className="rounded-xl border border-border bg-card overflow-hidden">
         <Table>
           <TableHeader>
             <TableRow className="bg-muted/50 hover:bg-muted/50">
               {columns.map((column) => (
                 <TableHead
                   key={column.key}
                   className={cn("font-semibold", column.className)}
                 >
                   {column.header}
                 </TableHead>
               ))}
             </TableRow>
           </TableHeader>
           <TableBody>
             {loading ? (
               <TableRow>
                 <TableCell
                   colSpan={columns.length}
                   className="h-32 text-center"
                 >
                   <div className="flex items-center justify-center">
                     <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                   </div>
                 </TableCell>
               </TableRow>
             ) : paginatedData.length === 0 ? (
               <TableRow>
                 <TableCell
                   colSpan={columns.length}
                   className="h-32 text-center text-muted-foreground"
                 >
                   {emptyMessage}
                 </TableCell>
               </TableRow>
             ) : (
               paginatedData.map((item, index) => (
                 <TableRow
                   key={index}
                   className="transition-colors hover:bg-muted/30"
                 >
                   {columns.map((column) => (
                     <TableCell key={column.key} className={column.className}>
                       {column.render
                         ? column.render(item)
                         : (item[column.key] as React.ReactNode)}
                     </TableCell>
                   ))}
                 </TableRow>
               ))
             )}
           </TableBody>
         </Table>
       </div>
 
       {totalPages > 1 && (
         <div className="flex items-center justify-between">
           <p className="text-sm text-muted-foreground">
             Showing {page * pageSize + 1} to{" "}
             {Math.min((page + 1) * pageSize, filteredData.length)} of{" "}
             {filteredData.length} results
           </p>
           <div className="flex items-center gap-2">
             <Button
               variant="outline"
               size="sm"
               onClick={() => setPage(page - 1)}
               disabled={page === 0}
             >
               <ChevronLeft className="w-4 h-4" />
             </Button>
             <span className="text-sm font-medium">
               Page {page + 1} of {totalPages}
             </span>
             <Button
               variant="outline"
               size="sm"
               onClick={() => setPage(page + 1)}
               disabled={page >= totalPages - 1}
             >
               <ChevronRight className="w-4 h-4" />
             </Button>
           </div>
         </div>
       )}
     </div>
   );
 }