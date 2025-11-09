-- Add counsellor verification fields to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS counsellor_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS counsellor_comment text,
ADD COLUMN IF NOT EXISTS counsellor_verified_at timestamp with time zone;

-- Add class advisor verification fields to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS class_advisor_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS class_advisor_comment text,
ADD COLUMN IF NOT EXISTS class_advisor_verified_at timestamp with time zone;

-- Create RLS policies for counsellors
CREATE POLICY "Counsellors can view all applications" 
ON applications 
FOR SELECT 
USING (has_role(auth.uid(), 'counsellor'));

CREATE POLICY "Counsellors can update applications" 
ON applications 
FOR UPDATE 
USING (has_role(auth.uid(), 'counsellor'));

-- Create RLS policies for class advisors
CREATE POLICY "Class advisors can view all applications" 
ON applications 
FOR SELECT 
USING (has_role(auth.uid(), 'class_advisor'));

CREATE POLICY "Class advisors can update applications" 
ON applications 
FOR UPDATE 
USING (has_role(auth.uid(), 'class_advisor'));