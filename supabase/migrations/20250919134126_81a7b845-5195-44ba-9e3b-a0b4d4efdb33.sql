-- Fix security issue: Restrict project visibility to authenticated users only
DROP POLICY IF EXISTS "Everyone can view projects" ON public.projects;

CREATE POLICY "Authenticated users can view projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() IS NOT NULL);