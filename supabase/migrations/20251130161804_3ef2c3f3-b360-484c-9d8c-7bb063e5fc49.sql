-- Create sender_role enum
CREATE TYPE public.sender_role AS ENUM ('student', 'admin');

-- Create message_type enum  
CREATE TYPE public.message_type AS ENUM ('text', 'system');

-- Create complaint_messages table
CREATE TABLE public.complaint_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role sender_role NOT NULL,
  content TEXT NOT NULL,
  message_type message_type NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_by_student BOOLEAN NOT NULL DEFAULT false,
  read_by_admin BOOLEAN NOT NULL DEFAULT false
);

-- Create indexes for performance
CREATE INDEX idx_complaint_messages_complaint_id ON public.complaint_messages(complaint_id);
CREATE INDEX idx_complaint_messages_created_at ON public.complaint_messages(created_at);
CREATE INDEX idx_complaint_messages_unread_student ON public.complaint_messages(complaint_id) WHERE read_by_student = false;
CREATE INDEX idx_complaint_messages_unread_admin ON public.complaint_messages(complaint_id) WHERE read_by_admin = false;

-- Enable RLS
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;

-- Students can view messages for their own complaints
CREATE POLICY "Students can view messages for own complaints"
ON public.complaint_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complaints 
    WHERE complaints.id = complaint_messages.complaint_id 
    AND complaints.student_id = auth.uid()
  )
);

-- Students can insert messages for their own complaints
CREATE POLICY "Students can send messages for own complaints"
ON public.complaint_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() 
  AND sender_role = 'student'
  AND EXISTS (
    SELECT 1 FROM public.complaints 
    WHERE complaints.id = complaint_messages.complaint_id 
    AND complaints.student_id = auth.uid()
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.complaint_messages FOR SELECT
USING (is_admin());

-- Admins can insert messages
CREATE POLICY "Admins can send messages"
ON public.complaint_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() 
  AND sender_role = 'admin' 
  AND is_admin()
);

-- Students can update read_by_student on messages in their complaints
CREATE POLICY "Students can mark messages as read"
ON public.complaint_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.complaints 
    WHERE complaints.id = complaint_messages.complaint_id 
    AND complaints.student_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.complaints 
    WHERE complaints.id = complaint_messages.complaint_id 
    AND complaints.student_id = auth.uid()
  )
);

-- Admins can update read_by_admin
CREATE POLICY "Admins can mark messages as read"
ON public.complaint_messages FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_messages;