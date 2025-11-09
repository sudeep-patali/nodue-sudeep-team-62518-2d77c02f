-- Add counsellor_id and class_advisor_id columns to applications table
ALTER TABLE applications
ADD COLUMN counsellor_id uuid REFERENCES staff_profiles(id),
ADD COLUMN class_advisor_id uuid REFERENCES staff_profiles(id);

-- Add indexes for performance
CREATE INDEX idx_applications_counsellor_id ON applications(counsellor_id);
CREATE INDEX idx_applications_class_advisor_id ON applications(class_advisor_id);

-- Add helpful comments
COMMENT ON COLUMN applications.counsellor_id IS 'Student-selected counsellor for this application';
COMMENT ON COLUMN applications.class_advisor_id IS 'Student-selected class advisor for this application';

-- Drop old broad policies for counsellors and class advisors
DROP POLICY IF EXISTS "Counsellors can view all applications" ON applications;
DROP POLICY IF EXISTS "Counsellors can update applications" ON applications;
DROP POLICY IF EXISTS "Class advisors can view all applications" ON applications;
DROP POLICY IF EXISTS "Class advisors can update applications" ON applications;

-- Create assignment-based policies for counsellors
CREATE POLICY "Counsellors can view assigned applications"
ON applications FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'counsellor'::app_role) 
  AND counsellor_id = auth.uid()
);

CREATE POLICY "Counsellors can update assigned applications"
ON applications FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'counsellor'::app_role) 
  AND counsellor_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'counsellor'::app_role) 
  AND counsellor_id = auth.uid()
);

-- Create assignment-based policies for class advisors
CREATE POLICY "Class advisors can view assigned applications"
ON applications FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'class_advisor'::app_role) 
  AND class_advisor_id = auth.uid()
);

CREATE POLICY "Class advisors can update assigned applications"
ON applications FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'class_advisor'::app_role) 
  AND class_advisor_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'class_advisor'::app_role) 
  AND class_advisor_id = auth.uid()
);