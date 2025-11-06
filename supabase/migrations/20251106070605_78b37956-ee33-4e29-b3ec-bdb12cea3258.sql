-- Add RLS policy to allow students to update their own applications with payment details
CREATE POLICY "Students can update their payment details"
ON public.applications
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id AND hod_verified = true)
WITH CHECK (auth.uid() = student_id AND hod_verified = true);