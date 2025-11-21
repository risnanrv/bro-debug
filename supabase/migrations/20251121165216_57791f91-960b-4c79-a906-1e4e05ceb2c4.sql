-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_photos', 'profile_photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for profile photos bucket
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile_photos');

CREATE POLICY "Users can update their own profile photo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile_photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add custom_category_text column to complaints for "Other" category
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS custom_category_text TEXT;

-- Update category enum
-- Step 1: Change column to text temporarily
ALTER TABLE public.complaints
ALTER COLUMN category TYPE TEXT;

-- Step 2: Update existing data to map old categories to new ones
UPDATE public.complaints
SET category = CASE
  WHEN category = 'Mentor Behavior' THEN 'Mentor Behavior / Staff Attitude'
  WHEN category = 'Technical Support' THEN 'Laptop / Lab / Internet / Wi-Fi Issue'
  WHEN category = 'Laptop / Lab Issue' THEN 'Laptop / Lab / Internet / Wi-Fi Issue'
  WHEN category = 'Mental Health / Harassment' THEN 'Mental Health / Harassment / Bullying'
  ELSE category
END;

-- Step 3: Drop old enum type
DROP TYPE IF EXISTS public.category CASCADE;

-- Step 4: Create new enum with updated categories
CREATE TYPE public.category AS ENUM (
  'Hostel / Accommodation',
  'Mentor Behavior / Staff Attitude',
  'Curriculum / Teaching',
  'Batch Management',
  'Laptop / Lab / Internet / Wi-Fi Issue',
  'Payment / Finance',
  'Food / Canteen',
  'Mental Health / Harassment / Bullying',
  'Miscommunication / Misleading Information',
  'Personal Safety',
  'Other'
);

-- Step 5: Change column back to enum type
ALTER TABLE public.complaints
ALTER COLUMN category TYPE public.category USING category::public.category;