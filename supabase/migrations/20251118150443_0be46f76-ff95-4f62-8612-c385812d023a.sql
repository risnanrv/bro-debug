-- Fix the handle_new_user trigger to properly handle enum types
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role text;
  _user_role user_role;
  _app_role app_role;
BEGIN
  -- Get role from metadata, default to 'student'
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Cast to appropriate enum types
  _user_role := _role::user_role;
  _app_role := _role::app_role;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    _user_role
  );
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _app_role);
  
  RETURN NEW;
END;
$$;