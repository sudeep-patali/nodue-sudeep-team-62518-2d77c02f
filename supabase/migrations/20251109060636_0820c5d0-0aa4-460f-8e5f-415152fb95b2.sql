-- Drop the security definer views
DROP VIEW IF EXISTS public.counsellors_public;
DROP VIEW IF EXISTS public.class_advisors_public;

-- Add RLS policies to user_roles to allow viewing counsellor and class_advisor roles
-- Students need to see which staff members have these roles to select them

CREATE POLICY "Anyone can view counsellor and class_advisor roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (role IN ('counsellor', 'class_advisor'));

-- Note: This policy works alongside the existing "Users can view their own roles" policy
-- Users can see their own roles (all of them) OR counsellor/class_advisor roles of others