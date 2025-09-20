-- Update joannt@foodforthepoor.ca to admin role
UPDATE public.profiles 
SET role = 'admin'::public.app_role 
WHERE user_id = '19524edd-0930-44fb-8b97-e402c27a568e';