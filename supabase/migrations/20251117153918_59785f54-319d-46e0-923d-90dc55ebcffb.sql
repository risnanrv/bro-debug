-- Fix infinite recursion by removing self-referential admin checks and using JWT claims instead

-- 1) Helper function to check admin role from JWT
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false);
$$;

-- 2) Replace admin policies to avoid referencing profiles table

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin());

-- Complaints
DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaints;
CREATE POLICY "Admins can view all complaints"
ON public.complaints
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all complaints" ON public.complaints;
CREATE POLICY "Admins can update all complaints"
ON public.complaints
FOR UPDATE
USING (public.is_admin());

-- Resolution notes
DROP POLICY IF EXISTS "Admins can view all notes" ON public.resolution_notes;
CREATE POLICY "Admins can view all notes"
ON public.resolution_notes
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can create notes" ON public.resolution_notes;
CREATE POLICY "Admins can create notes"
ON public.resolution_notes
FOR INSERT
WITH CHECK (public.is_admin());

-- Announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements"
ON public.announcements
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());
