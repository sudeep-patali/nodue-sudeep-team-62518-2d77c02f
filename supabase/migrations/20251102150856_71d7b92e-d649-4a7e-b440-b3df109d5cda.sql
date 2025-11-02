-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'faculty', 'library', 'hostel', 'college_office', 'hod', 'lab_instructor');

-- Create enum for departments
CREATE TYPE public.department AS ENUM ('MECH', 'CSE', 'CIVIL', 'EC', 'AIML', 'CD');

-- Create enum for sections
CREATE TYPE public.section AS ENUM ('A', 'B');

-- Create enum for student type
CREATE TYPE public.student_type AS ENUM ('local', 'hostel');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  usn TEXT UNIQUE,
  department public.department,
  section public.section,
  semester INTEGER CHECK (semester BETWEEN 1 AND 8),
  batch TEXT,
  student_type public.student_type,
  phone TEXT,
  photo TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_profiles table for college staff/employees
CREATE TABLE public.staff_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  photo text,
  employee_id text UNIQUE,
  designation text,
  department department,
  date_of_joining date,
  office_location text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  current_semester INTEGER DEFAULT 1 CHECK (current_semester BETWEEN 1 AND 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  department public.department NOT NULL,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  is_elective BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code, department, semester)
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  batch TEXT NOT NULL,
  department public.department NOT NULL,
  semester INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  library_verified BOOLEAN DEFAULT FALSE,
  library_comment TEXT,
  hostel_verified BOOLEAN DEFAULT FALSE,
  hostel_comment TEXT,
  college_office_verified BOOLEAN DEFAULT FALSE,
  college_office_comment TEXT,
  hod_verified BOOLEAN DEFAULT FALSE,
  hod_comment TEXT,
  payment_verified BOOLEAN DEFAULT FALSE,
  payment_comment TEXT,
  lab_verified BOOLEAN DEFAULT FALSE,
  lab_comment TEXT,
  faculty_verified BOOLEAN DEFAULT FALSE,
  faculty_comment TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('approval', 'rejection', 'info', 'warning', 'success')),
  read boolean DEFAULT false,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Create audit log table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for staff_profiles
CREATE POLICY "Staff can view their own profile"
  ON public.staff_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Staff can update their own profile"
  ON public.staff_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all staff profiles"
  ON public.staff_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert staff profiles"
  ON public.staff_profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all staff profiles"
  ON public.staff_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for batches
CREATE POLICY "Anyone can view batches"
  ON public.batches FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage batches"
  ON public.batches FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subjects
CREATE POLICY "Anyone can view subjects"
  ON public.subjects FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON public.subjects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for applications
CREATE POLICY "Students can view their own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all applications"
  ON public.applications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Faculty can view department applications"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      JOIN public.user_roles ur ON ur.user_id = sp.id
      WHERE sp.id = auth.uid()
      AND sp.department = applications.department
      AND ur.role IN ('faculty', 'hod')
    )
  );

CREATE POLICY "Faculty can update department applications"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      JOIN public.user_roles ur ON ur.user_id = sp.id
      WHERE sp.id = auth.uid()
      AND sp.department = applications.department
      AND ur.role IN ('faculty', 'hod')
    )
  );

CREATE POLICY "Support staff can view all applications"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('library', 'hostel', 'lab_instructor', 'college_office')
    )
  );

CREATE POLICY "Support staff can update applications"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('library', 'hostel', 'lab_instructor', 'college_office')
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_applications_faculty_verified ON public.applications(faculty_verified);

-- Helper function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_related_entity_type text DEFAULT NULL,
  p_related_entity_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_entity_type,
    related_entity_id
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_related_entity_type,
    p_related_entity_id
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function for manual audit logging
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_action text,
  p_table_name text,
  p_record_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    metadata,
    created_at
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_metadata,
    now()
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- Enable realtime
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Add comments
COMMENT ON TABLE public.staff_profiles IS 'Staff member profiles including faculty and administrative staff';
COMMENT ON TABLE public.profiles IS 'Student profiles';
COMMENT ON TABLE public.user_roles IS 'User role assignments';
COMMENT ON TABLE public.applications IS 'No due certificate applications';
COMMENT ON COLUMN public.applications.faculty_verified IS 'Indicates if faculty has verified the application (happens after college office verification)';
COMMENT ON COLUMN public.applications.faculty_comment IS 'Comments from faculty during verification';