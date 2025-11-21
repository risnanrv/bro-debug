-- Create announcement_reads table to track which students have read which announcements
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, student_id)
);

-- Enable RLS on announcement_reads
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Students can view their own read status
CREATE POLICY "Students can view their own read status"
ON public.announcement_reads
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Students can mark announcements as read
CREATE POLICY "Students can mark announcements as read"
ON public.announcement_reads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Admins can manage announcements
CREATE POLICY "Admins can insert announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (is_admin());