-- Add feedback_unsatisfied to note_type enum
ALTER TYPE note_type ADD VALUE IF NOT EXISTS 'feedback_unsatisfied';

-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint-attachments',
  'complaint-attachments',
  false,
  26214400, -- 25MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for complaint-attachments bucket
CREATE POLICY "Students can upload attachments for their complaints"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own complaint attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'complaint-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all complaint attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'complaint-attachments'
  AND is_admin()
);

CREATE POLICY "Students can delete their own attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'complaint-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);