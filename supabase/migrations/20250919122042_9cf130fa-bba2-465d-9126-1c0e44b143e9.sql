-- Add assigned_admin field to projects table to store which admin can edit this project
ALTER TABLE public.projects 
ADD COLUMN assigned_admin UUID REFERENCES public.profiles(user_id);

-- Update RLS policies to check both admin role AND assigned admin
DROP POLICY IF EXISTS "Only admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Only admins can delete projects" ON public.projects;

-- Create new policies that check for assigned admin
CREATE POLICY "Only assigned admin can update projects" 
ON public.projects 
FOR UPDATE 
USING (
  public.get_user_role(auth.uid()) = 'admin' 
  AND (assigned_admin = auth.uid() OR assigned_admin IS NULL)
);

CREATE POLICY "Only assigned admin can delete projects" 
ON public.projects 
FOR DELETE 
USING (
  public.get_user_role(auth.uid()) = 'admin' 
  AND (assigned_admin = auth.uid() OR assigned_admin IS NULL)
);

-- Allow any admin to insert projects (they become assigned admin by default)
DROP POLICY IF EXISTS "Only admins can insert projects" ON public.projects;
CREATE POLICY "Only admins can insert projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  public.get_user_role(auth.uid()) = 'admin'
);

-- Create function to get admin profile info
CREATE OR REPLACE FUNCTION public.get_admin_profile(admin_user_id UUID)
RETURNS TABLE(email TEXT, display_name TEXT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.email, p.display_name 
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  WHERE au.id = admin_user_id;
$$;