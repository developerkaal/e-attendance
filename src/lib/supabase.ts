import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Class = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Student = {
  id: string;
  roll_no: string;
  full_name: string;
  class_id: string;
  email: string | null;
  phone: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  classes?: { id: string; name: string } | null;
};

export type Attendance = {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  is_present: boolean;
  marked_by: string;
  created_at: string;
  updated_at: string;
  students?: { id: string; full_name: string; roll_no: string } | null;
};