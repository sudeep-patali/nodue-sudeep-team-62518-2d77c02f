import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    // Create client with user's auth for role checking
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { application_id } = await req.json();

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: 'Application ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting application:', application_id);

    // Create service role client for deletions
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get application details before deletion for audit
    const { data: appData } = await serviceClient
      .from('applications')
      .select('student_id, batch, department, semester')
      .eq('id', application_id)
      .single();

    if (!appData) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Delete application_subject_faculty records
    const { error: facultyDeleteError, count: facultyCount } = await serviceClient
      .from('application_subject_faculty')
      .delete({ count: 'exact' })
      .eq('application_id', application_id);

    if (facultyDeleteError) {
      console.error('Error deleting faculty assignments:', facultyDeleteError);
      throw facultyDeleteError;
    }

    console.log(`Deleted ${facultyCount || 0} faculty assignments`);

    // Step 2: Delete notifications related to this application
    const { error: notifDeleteError, count: notifCount } = await serviceClient
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('related_entity_id', application_id)
      .eq('related_entity_type', 'application');

    if (notifDeleteError) {
      console.error('Error deleting notifications:', notifDeleteError);
      // Don't throw, continue with deletion
    }

    console.log(`Deleted ${notifCount || 0} notifications`);

    // Step 3: Delete the application
    const { error: appDeleteError } = await serviceClient
      .from('applications')
      .delete()
      .eq('id', application_id);

    if (appDeleteError) {
      console.error('Error deleting application:', appDeleteError);
      throw appDeleteError;
    }

    console.log('Application deleted successfully');

    // Create audit log
    await serviceClient.rpc('create_audit_log', {
      p_action: 'DELETE_APPLICATION',
      p_table_name: 'applications',
      p_record_id: application_id,
      p_metadata: {
        student_id: appData.student_id,
        batch: appData.batch,
        department: appData.department,
        semester: appData.semester,
        faculty_assignments_deleted: facultyCount || 0,
        notifications_deleted: notifCount || 0,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application deleted successfully',
        summary: {
          faculty_assignments_deleted: facultyCount || 0,
          notifications_deleted: notifCount || 0,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-application function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
