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
    const { staff_id } = await req.json();

    if (!staff_id) {
      return new Response(
        JSON.stringify({ error: 'staff_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for deletions
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get staff info for audit log
    const { data: staffProfile } = await serviceClient
      .from('staff_profiles')
      .select('name, employee_id, email, department')
      .eq('id', staff_id)
      .single();

    // Check if user is staff (library, hostel, college_office, lab_instructor)
    const { data: roles } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', staff_id)
      .in('role', ['library', 'hostel', 'college_office', 'lab_instructor']);

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'User is not a staff member' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete in order (respecting foreign keys)
    
    // 1. Delete notifications
    await serviceClient
      .from('notifications')
      .delete()
      .eq('user_id', staff_id);

    // 2. Delete user roles
    await serviceClient
      .from('user_roles')
      .delete()
      .eq('user_id', staff_id);

    // 3. Delete from staff_profiles
    const { error: profileError } = await serviceClient
      .from('staff_profiles')
      .delete()
      .eq('id', staff_id);

    if (profileError) {
      throw new Error(`Failed to delete staff profile: ${profileError.message}`);
    }

    // 4. Delete from auth.users
    const { error: authError } = await serviceClient.auth.admin.deleteUser(staff_id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
    }

    // 5. Create audit log
    await serviceClient.rpc('create_audit_log', {
      p_action: 'DELETE',
      p_table_name: 'staff_profiles',
      p_record_id: staff_id,
      p_metadata: {
        staff_name: staffProfile?.name,
        employee_id: staffProfile?.employee_id,
        staff_email: staffProfile?.email,
        department: staffProfile?.department,
        roles: roles.map(r => r.role),
        deleted_by: user.id
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Staff ${staffProfile?.name || staff_id} deleted successfully`,
        deletedRecords: {
          profile: 1
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-staff function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
