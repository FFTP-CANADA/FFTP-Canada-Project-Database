-- Allow admins to update other users' roles
CREATE POLICY "Admins can update user roles" 
ON public.profiles 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::app_role)
WITH CHECK (get_user_role(auth.uid()) = 'admin'::app_role);