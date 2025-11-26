-- Add foreign key constraints to applications table for staff relationships
ALTER TABLE applications
ADD CONSTRAINT fk_applications_counsellor 
  FOREIGN KEY (counsellor_id) REFERENCES staff_profiles(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_applications_class_advisor 
  FOREIGN KEY (class_advisor_id) REFERENCES staff_profiles(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_applications_library_verified_by 
  FOREIGN KEY (library_verified_by) REFERENCES staff_profiles(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_applications_hostel_verified_by 
  FOREIGN KEY (hostel_verified_by) REFERENCES staff_profiles(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_applications_college_office_verified_by 
  FOREIGN KEY (college_office_verified_by) REFERENCES staff_profiles(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_applications_hod_verified_by 
  FOREIGN KEY (hod_verified_by) REFERENCES staff_profiles(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_applications_lab_verified_by 
  FOREIGN KEY (lab_verified_by) REFERENCES staff_profiles(id) ON DELETE SET NULL;