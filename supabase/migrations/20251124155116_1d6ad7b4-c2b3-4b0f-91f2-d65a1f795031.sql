-- Create trigger function to notify student after counsellor verification
CREATE OR REPLACE FUNCTION public.notify_student_on_counsellor_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  -- Only proceed if counsellor just verified (status changed from false/null to true)
  IF NEW.counsellor_verified = true AND (OLD.counsellor_verified IS NULL OR OLD.counsellor_verified = false) THEN
    
    -- Get student profile
    SELECT * INTO v_profile 
    FROM profiles 
    WHERE id = NEW.student_id;
    
    -- Create notification for the student
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id
    ) VALUES (
      NEW.student_id,
      'Counsellor Verification Complete',
      format('Your application has been verified by the counsellor. Current status: %s', NEW.status),
      'approval',
      'application',
      NEW.id
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger function to notify student after class advisor verification
CREATE OR REPLACE FUNCTION public.notify_student_on_class_advisor_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  -- Only proceed if class advisor just verified (status changed from false/null to true)
  IF NEW.class_advisor_verified = true AND (OLD.class_advisor_verified IS NULL OR OLD.class_advisor_verified = false) THEN
    
    -- Get student profile
    SELECT * INTO v_profile 
    FROM profiles 
    WHERE id = NEW.student_id;
    
    -- Create notification for the student
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id
    ) VALUES (
      NEW.student_id,
      'Class Advisor Verification Complete',
      format('Your application has been verified by the class advisor. Current status: %s', NEW.status),
      'approval',
      'application',
      NEW.id
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for counsellor verification notification
DROP TRIGGER IF EXISTS notify_student_on_counsellor_verification_trigger ON applications;
CREATE TRIGGER notify_student_on_counsellor_verification_trigger
  AFTER UPDATE ON applications
  FOR EACH ROW
  WHEN (NEW.counsellor_verified = true AND (OLD.counsellor_verified IS NULL OR OLD.counsellor_verified = false))
  EXECUTE FUNCTION notify_student_on_counsellor_verification();

-- Create trigger for class advisor verification notification
DROP TRIGGER IF EXISTS notify_student_on_class_advisor_verification_trigger ON applications;
CREATE TRIGGER notify_student_on_class_advisor_verification_trigger
  AFTER UPDATE ON applications
  FOR EACH ROW
  WHEN (NEW.class_advisor_verified = true AND (OLD.class_advisor_verified IS NULL OR OLD.class_advisor_verified = false))
  EXECUTE FUNCTION notify_student_on_class_advisor_verification();