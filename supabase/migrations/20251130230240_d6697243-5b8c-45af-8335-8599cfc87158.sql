-- Add RLS policy to allow faculty to view applications where they are assigned
CREATE POLICY "Faculty can view applications where assigned"
ON public.applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM application_subject_faculty asf
    WHERE asf.application_id = applications.id
    AND asf.faculty_id = auth.uid()
  )
);