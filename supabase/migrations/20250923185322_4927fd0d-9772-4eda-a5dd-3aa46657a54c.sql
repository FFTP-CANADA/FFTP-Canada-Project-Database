-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Only assigned admin can update projects" ON public.projects;
DROP POLICY IF EXISTS "Only assigned admin can delete projects" ON public.projects;

-- Create new policies allowing all authenticated users to insert and update
CREATE POLICY "Authenticated users can insert projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Note: No DELETE policy is created, so no user can delete projects