-- Check current RLS policies on profiles table and add admin update policy
-- Allow admins to update any user's profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin'::user_role);