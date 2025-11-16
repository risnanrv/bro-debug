-- Create enum types
CREATE TYPE public.user_role AS ENUM ('student', 'admin');
CREATE TYPE public.learning_track AS ENUM ('Web Dev', 'Mobile', 'Cybersecurity', 'AI', 'Game Dev', 'Blockchain', 'Data Science', 'AR/VR', 'Software Testing', 'DevOps');
CREATE TYPE public.mode AS ENUM ('Offline', 'Online');
CREATE TYPE public.location AS ENUM ('Kochi', 'Calicut', 'Trivandrum', 'Bangalore', 'Coimbatore', 'Chennai', 'Other');
CREATE TYPE public.complaint_status AS ENUM ('Pending', 'In Progress', 'Resolved', 'Closed', 'Escalated');
CREATE TYPE public.priority AS ENUM ('Critical', 'Urgent', 'Normal');
CREATE TYPE public.category AS ENUM ('Hostel / Accommodation', 'Mentor Behavior', 'Curriculum / Teaching', 'Technical Support', 'Laptop / Lab Issue', 'Payment & Finance', 'Food / Canteen', 'Mental Health / Harassment', 'Other');
CREATE TYPE public.satisfaction AS ENUM ('satisfied', 'unsatisfied');
CREATE TYPE public.note_type AS ENUM ('public', 'internal');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  batch_name TEXT,
  learning_track learning_track,
  mode mode,
  location location,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  student_name_cached TEXT NOT NULL,
  title TEXT NOT NULL,
  category category NOT NULL,
  description TEXT NOT NULL,
  attachments TEXT[],
  status complaint_status NOT NULL DEFAULT 'Pending',
  priority priority NOT NULL DEFAULT 'Normal',
  satisfaction satisfaction,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Enable RLS on complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Complaints policies
CREATE POLICY "Students can view their own complaints"
  ON public.complaints FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own complaints (limited)"
  ON public.complaints FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all complaints"
  ON public.complaints FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update all complaints"
  ON public.complaints FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create resolution_notes table
CREATE TABLE public.resolution_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type note_type NOT NULL DEFAULT 'public',
  message TEXT NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on resolution_notes
ALTER TABLE public.resolution_notes ENABLE ROW LEVEL SECURITY;

-- Resolution notes policies
CREATE POLICY "Students can view public notes for their complaints"
  ON public.resolution_notes FOR SELECT
  USING (
    type = 'public' AND
    EXISTS (
      SELECT 1 FROM public.complaints
      WHERE complaints.id = complaint_id AND complaints.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all notes"
  ON public.resolution_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can create notes"
  ON public.resolution_notes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "Students can view announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-detect priority based on keywords
CREATE OR REPLACE FUNCTION public.detect_priority(description TEXT)
RETURNS priority AS $$
BEGIN
  IF description ~* '(harassment|mental|abuse)' THEN
    RETURN 'Critical';
  ELSIF description ~* '(hostel|food|wifi|lab)' THEN
    RETURN 'Urgent';
  ELSE
    RETURN 'Normal';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check for escalation (complaints in progress > 7 days)
CREATE OR REPLACE FUNCTION public.check_escalation()
RETURNS void AS $$
BEGIN
  UPDATE public.complaints
  SET status = 'Escalated'
  WHERE status = 'In Progress'
    AND created_at < NOW() - INTERVAL '7 days'
    AND status != 'Escalated';
END;
$$ LANGUAGE plpgsql;

-- Insert admin user (password will be set via Supabase Auth)
-- Note: Admin account must be created manually in Supabase Auth with email admin@brototype.com