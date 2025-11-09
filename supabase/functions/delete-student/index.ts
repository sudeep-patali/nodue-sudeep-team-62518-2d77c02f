import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables');
    }

    // Create client with user's auth token for authorization check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { student_id } = await req.json();

    if (!student_id) {
      return new Response(
        JSON.stringify({ error: 'student_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for deletions
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get student info for audit log
    const { data: studentProfile } = await serviceClient
      .from('profiles')
      .select('name, usn, email')
      .eq('id', student_id)
      .single();

    // Delete in order (respecting foreign keys)
    
    // 1. Delete from application_subject_faculty (via applications)
    const { data: applications } = await serviceClient
      .from('applications')
      .select('id')
      .eq('student_id', student_id);

    if (applications && applications.length > 0) {
      const applicationIds = applications.map(app => app.id);
      
      await serviceClient
        .from('application_subject_faculty')
        .delete()
        .in('application_id', applicationIds);
    }

    // 2. Delete applications
    await serviceClient
      .from('applications')
      .delete()
      .eq('student_id', student_id);

    // 3. Delete notifications
    await serviceClient
      .from('notifications')
      .delete()
      .eq('user_id', student_id);

    // 4. Delete user roles
    await serviceClient
      .from('user_roles')
      .delete()
      .eq('user_id', student_id);

    // 5. Delete from profiles
    const { error: profileError } = await serviceClient
      .from('profiles')
      .delete()
      .eq('id', student_id);

    if (profileError) {
      throw new Error(`Failed to delete profile: ${profileError.message}`);
    }

    // 6. Delete from auth.users
    const { error: authError } = await serviceClient.auth.admin.deleteUser(student_id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
    }

    // 7. Create audit log
    await serviceClient.rpc('create_audit_log', {
      p_action: 'DELETE',
      p_table_name: 'profiles',
      p_record_id: student_id,
      p_metadata: {
        student_name: studentProfile?.name,
        student_usn: studentProfile?.usn,
        student_email: studentProfile?.email,
        deleted_by: user.id
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Student ${studentProfile?.name || student_id} deleted successfully`,
        deletedRecords: {
          applications: applications?.length || 0,
          profile: 1
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-student function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
