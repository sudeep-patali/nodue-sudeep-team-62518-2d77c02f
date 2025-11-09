-- Create view for counsellors (must also be faculty)
CREATE OR REPLACE VIEW public.counsellors_public AS
SELECT DISTINCT
  sp.id,
  sp.name,
  sp.designation,
  sp.department,
  sp.is_active
FROM staff_profiles sp
WHERE sp.is_active = true
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = sp.id AND ur.role = 'faculty'
  )
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = sp.id AND ur.role = 'counsellor'
  )
ORDER BY sp.name;

-- Create view for class advisors (must also be faculty)
CREATE OR REPLACE VIEW public.class_advisors_public AS
SELECT DISTINCT
  sp.id,
  sp.name,
  sp.designation,
  sp.department,
  sp.is_active
FROM staff_profiles sp
WHERE sp.is_active = true
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = sp.id AND ur.role = 'faculty'
  )
  AND EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = sp.id AND ur.role = 'class_advisor'
  )
ORDER BY sp.name;

-- Grant SELECT to authenticated users
GRANT SELECT ON public.counsellors_public TO authenticated;
GRANT SELECT ON public.class_advisors_public TO authenticated;