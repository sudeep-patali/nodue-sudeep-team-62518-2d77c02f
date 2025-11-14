import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const VALID_DEPARTMENTS = ['MECH', 'CSE', 'CIVIL', 'EC', 'AIML', 'CD'];
const VALID_SECTIONS = ['A', 'B', 'C'];
const VALID_STUDENT_TYPES = ['Regular', 'Lateral'];

interface SubjectFaculty {
  subject_id: string;
  faculty_id: string;
}

interface ApplicationSubmission {
  department: string;
  semester: number;
  batch: string;
  subjects: SubjectFaculty[];
  counsellor_id: string;
  class_advisor_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile to check batch and completion status
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('batch, profile_completed')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if profile is completed
    if (!profile.profile_completed) {
      return new Response(
        JSON.stringify({ error: 'Profile must be completed before submitting application' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if submissions are allowed for this batch
    const { data: submissionAllowed, error: checkError } = await supabaseAdmin
      .rpc('check_submission_allowed', { p_batch_name: profile.batch });

    if (checkError) {
      console.error('Error checking submission status:', checkError);
      return new Response(
        JSON.stringify({ error: 'Unable to verify submission eligibility' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!submissionAllowed) {
      console.log('Submission blocked for batch:', profile.batch);
      return new Response(
        JSON.stringify({ 
          error: 'Submissions are currently not allowed for your batch. Please check with administration or try again during the scheduled submission window.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const submission: ApplicationSubmission = await req.json();
    console.log('Received submission:', { userId: user.id, submission });

    // Validate department
    if (!VALID_DEPARTMENTS.includes(submission.department)) {
      return new Response(
        JSON.stringify({ error: `Invalid department. Must be one of: ${VALID_DEPARTMENTS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate semester
    if (!Number.isInteger(submission.semester) || submission.semester < 1 || submission.semester > 8) {
      return new Response(
        JSON.stringify({ error: 'Invalid semester. Must be between 1 and 8' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate batch format (YYYY-YY)
    const batchRegex = /^\d{4}-\d{2}$/;
    if (!batchRegex.test(submission.batch)) {
      return new Response(
        JSON.stringify({ error: 'Invalid batch format. Must be in format YYYY-YY (e.g., 2023-27)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate subjects array
    if (!Array.isArray(submission.subjects) || submission.subjects.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one subject must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUIDs for subjects and faculty
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const sf of submission.subjects) {
      if (!uuidRegex.test(sf.subject_id) || !uuidRegex.test(sf.faculty_id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid subject or faculty ID format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate counsellor_id
    if (!submission.counsellor_id || !uuidRegex.test(submission.counsellor_id)) {
      return new Response(
        JSON.stringify({ error: 'Valid Student Counsellor must be selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate class_advisor_id
    if (!submission.class_advisor_id || !uuidRegex.test(submission.class_advisor_id)) {
      return new Response(
        JSON.stringify({ error: 'Valid Class Advisor must be selected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying counsellor and class advisor...');

    // Verify counsellor exists, is active, and has proper designation
    const { data: counsellor, error: counsellorError } = await supabaseAdmin
      .from('staff_profiles')
      .select('id, name, is_active, designation')
      .eq('id', submission.counsellor_id)
      .eq('is_active', true)
      .single();

    if (counsellorError || !counsellor) {
      return new Response(
        JSON.stringify({ error: 'Selected counsellor is invalid or inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify counsellor has proper designation (HOD, Assistant Professor, or Associate Professor)
    const validDesignations = ['HOD', 'Assistant Professor', 'Associate Professor'];
    if (!validDesignations.includes(counsellor.designation)) {
      return new Response(
        JSON.stringify({ error: 'Counsellor must be HOD, Assistant Professor, or Associate Professor' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }


    // Verify class advisor exists, is active, and has proper designation
    const { data: classAdvisor, error: advisorError } = await supabaseAdmin
      .from('staff_profiles')
      .select('id, name, is_active, designation')
      .eq('id', submission.class_advisor_id)
      .eq('is_active', true)
      .single();

    if (advisorError || !classAdvisor) {
      return new Response(
        JSON.stringify({ error: 'Selected class advisor is invalid or inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify class advisor has proper designation (HOD, Assistant Professor, or Associate Professor)
    const validAdvisorDesignations = ['HOD', 'Assistant Professor', 'Associate Professor'];
    if (!validAdvisorDesignations.includes(classAdvisor.designation)) {
      return new Response(
        JSON.stringify({ error: 'Class advisor must be HOD, Assistant Professor, or Associate Professor' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Counsellor and class advisor verified');

    // Check for duplicate application
    console.log('Checking for duplicate application...');
    const { data: existingApp, error: dupCheckError } = await supabaseClient
      .from('applications')
      .select('id')
      .eq('student_id', user.id)
      .eq('semester', submission.semester)
      .eq('batch', submission.batch)
      .maybeSingle();

    if (dupCheckError) {
      console.error('Duplicate check error:', dupCheckError);
    }

    if (existingApp) {
      console.log('Duplicate application found');
      return new Response(
        JSON.stringify({ error: 'You have already submitted an application for this semester and batch' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('No duplicate application found');

    // Verify subjects exist
    console.log('Verifying subjects...');
    const subjectIds = submission.subjects.map(s => s.subject_id);
    const { data: subjects, error: subjectsError } = await supabaseClient
      .from('subjects')
      .select('id')
      .in('id', subjectIds);

    if (subjectsError || subjects.length !== subjectIds.length) {
      console.error('Subject verification error:', subjectsError);
      console.error('Expected subjects:', subjectIds.length, 'Found:', subjects?.length || 0);
      return new Response(
        JSON.stringify({ error: 'One or more subjects are invalid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('All subjects verified');

    // Verify faculty exist (use admin client to bypass RLS)
    console.log('Verifying faculty...');
    const uniqueFacultyIds = [...new Set(submission.subjects.map(s => s.faculty_id))];
    const { data: faculty, error: facultyError } = await supabaseAdmin
      .from('staff_profiles')
      .select('id')
      .in('id', uniqueFacultyIds)
      .eq('is_active', true);

    if (facultyError || !faculty || faculty.length !== uniqueFacultyIds.length) {
      console.error('Faculty verification error:', facultyError);
      console.error('Expected unique faculty:', uniqueFacultyIds.length, 'Found:', faculty?.length || 0);
      return new Response(
        JSON.stringify({ error: 'One or more faculty members are invalid or inactive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('All faculty verified');

    // Create application
    console.log('Creating application...');
    const { data: appData, error: appError } = await supabaseClient
      .from('applications')
      .insert({
        student_id: user.id,
        department: submission.department,
        semester: submission.semester,
        batch: submission.batch,
        counsellor_id: submission.counsellor_id,
        class_advisor_id: submission.class_advisor_id,
        status: 'pending',
      })
      .select()
      .single();

    if (appError) {
      console.error('Application creation error:', appError);
      return new Response(
        JSON.stringify({ error: 'Failed to create application: ' + appError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Application created with ID:', appData.id);

    // Create subject-faculty mappings
    console.log('Creating subject-faculty mappings...');
    const mappings = submission.subjects.map(sf => ({
      application_id: appData.id,
      subject_id: sf.subject_id,
      faculty_id: sf.faculty_id,
      faculty_verified: false,
    }));

    const { error: mappingError } = await supabaseClient
      .from('application_subject_faculty')
      .insert(mappings);

    if (mappingError) {
      console.error('Mapping creation error:', mappingError);
      // Rollback application creation
      await supabaseClient.from('applications').delete().eq('id', appData.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create subject-faculty mappings: ' + mappingError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Subject-faculty mappings created successfully');

    // Create audit log
    await supabaseClient.rpc('create_audit_log', {
      p_action: 'CREATE_APPLICATION',
      p_table_name: 'applications',
      p_record_id: appData.id,
      p_metadata: {
        department: submission.department,
        semester: submission.semester,
        subject_count: submission.subjects.length,
      },
    });

    // Get student profile for notifications
    const { data: studentProfile } = await supabaseClient
      .from('profiles')
      .select('name, usn, department')
      .eq('id', user.id)
      .single();

    if (!studentProfile) {
      console.error('Student profile not found');
      return new Response(
        JSON.stringify({ error: 'Student profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification to library staff (use admin client to bypass RLS)
    const { data: libraryStaff } = await supabaseAdmin.rpc('get_users_by_role', {
      role_name: 'library',
    });

    if (libraryStaff && libraryStaff.length > 0) {
      const notifications = libraryStaff.map((staff: any) => ({
        user_id: staff.user_id,
        title: 'New No Due Application',
        message: `A new no due application has been submitted for ${submission.department} - Semester ${submission.semester}`,
        type: 'info',
        related_entity_type: 'application',
        related_entity_id: appData.id,
      }));

      await supabaseAdmin.rpc('create_bulk_notifications', {
        notifications,
      });
    }

    // Notify assigned counsellor (informational only - no action required yet)
    await supabaseAdmin.rpc('create_notification', {
      p_user_id: submission.counsellor_id,
      p_title: 'New Student Assignment',
      p_message: `${studentProfile.name} (${studentProfile.usn}) from ${studentProfile.department} has selected you as their Student Counsellor. The application is currently in the faculty verification stage. You will be notified when it's ready for your review.`,
      p_type: 'info',
      p_related_entity_type: 'application',
      p_related_entity_id: appData.id,
    });

    // Notify assigned class advisor (informational only - no action required yet)
    await supabaseAdmin.rpc('create_notification', {
      p_user_id: submission.class_advisor_id,
      p_title: 'New Student Assignment',
      p_message: `${studentProfile.name} (${studentProfile.usn}) from ${studentProfile.department} has selected you as their Class Advisor. The application is currently in the early verification stages. You will be notified when it's ready for your review.`,
      p_type: 'info',
      p_related_entity_type: 'application',
      p_related_entity_id: appData.id,
    });

    console.log('Application created successfully:', appData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        application_id: appData.id,
        message: 'Application submitted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-application:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
