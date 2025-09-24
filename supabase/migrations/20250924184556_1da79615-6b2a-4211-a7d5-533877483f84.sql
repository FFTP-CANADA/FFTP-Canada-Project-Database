-- Update all existing viewer users to have contributor access
UPDATE public.profiles 
SET role = 'admin'::public.app_role 
WHERE role = 'viewer'::public.app_role;

-- Update the trigger function to create new users as admins (contributors) by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create new users as admins (contributors) by default
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    'admin'::public.app_role
  );
  RETURN NEW;
END;
$function$;

-- Add a DELETE policy that prevents all deletions
CREATE POLICY "No one can delete projects" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (false);