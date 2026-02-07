
-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin');

-- Create profiles table for admin users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_no TEXT NOT NULL,
    full_name TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (roll_no, class_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_present BOOLEAN NOT NULL DEFAULT false,
    marked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (student_id, class_id, date)
);

-- Create attendance_log table for edit history
CREATE TABLE public.attendance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES public.attendance(id) ON DELETE CASCADE,
    previous_status BOOLEAN NOT NULL,
    new_status BOOLEAN NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_log ENABLE ROW LEVEL SECURITY;

-- Create has_role function to prevent recursion in RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Create function to check if user is an admin (any role)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
    )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Classes policies - admins can manage their own classes
CREATE POLICY "Admins can view their classes"
ON public.classes FOR SELECT
USING (public.is_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Admins can create classes"
ON public.classes FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Admins can update their classes"
ON public.classes FOR UPDATE
USING (public.is_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Admins can delete their classes"
ON public.classes FOR DELETE
USING (public.is_admin(auth.uid()) AND created_by = auth.uid());

-- Students policies
CREATE POLICY "Admins can view students in their classes"
ON public.students FOR SELECT
USING (public.is_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Admins can create students"
ON public.students FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Admins can update their students"
ON public.students FOR UPDATE
USING (public.is_admin(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Admins can delete their students"
ON public.students FOR DELETE
USING (public.is_admin(auth.uid()) AND created_by = auth.uid());

-- Attendance policies
CREATE POLICY "Admins can view attendance for their classes"
ON public.attendance FOR SELECT
USING (public.is_admin(auth.uid()) AND marked_by = auth.uid());

CREATE POLICY "Admins can mark attendance"
ON public.attendance FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) AND marked_by = auth.uid());

CREATE POLICY "Admins can update attendance"
ON public.attendance FOR UPDATE
USING (public.is_admin(auth.uid()) AND marked_by = auth.uid());

CREATE POLICY "Admins can delete attendance"
ON public.attendance FOR DELETE
USING (public.is_admin(auth.uid()) AND marked_by = auth.uid());

-- Attendance log policies
CREATE POLICY "Admins can view attendance logs"
ON public.attendance_log FOR SELECT
USING (public.is_admin(auth.uid()) AND changed_by = auth.uid());

CREATE POLICY "Admins can create attendance logs"
ON public.attendance_log FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) AND changed_by = auth.uid());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile and assign admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'), NEW.email);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
