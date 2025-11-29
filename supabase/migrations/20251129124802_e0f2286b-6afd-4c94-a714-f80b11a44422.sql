-- Allow students to create clarification requests and close requests for their own complaints
CREATE POLICY "Students can create clarification and close requests"
ON public.resolution_notes
FOR INSERT
WITH CHECK (
  (type = 'clarification_request' OR type = 'close_request')
  AND auth.uid() = admin_id
  AND EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = resolution_notes.complaint_id
    AND complaints.student_id = auth.uid()
  )
);