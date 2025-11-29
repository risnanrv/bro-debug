-- Add new note types for clarification and close requests
ALTER TYPE note_type ADD VALUE IF NOT EXISTS 'clarification_request';
ALTER TYPE note_type ADD VALUE IF NOT EXISTS 'close_request';

-- Add close_requested flag to complaints table
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS close_requested boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.complaints.close_requested IS 'Flag indicating if student has requested to close the complaint';