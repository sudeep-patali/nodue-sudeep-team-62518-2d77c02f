import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Only admins can delete batches' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { batchName } = await req.json();

    // Check if batch exists
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, name')
      .eq('name', batchName)
      .single();

    if (batchError || !batch) {
      return new Response(
        JSON.stringify({ error: 'Batch not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count students
    const { count: studentCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('batch', batchName);

    // Count applications
    const { count: applicationCount } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('batch', batchName);

    // Get application IDs for cascade deletion
    const { data: applications } = await supabase
      .from('applications')
      .select('id')
      .eq('batch', batchName);

    const applicationIds = applications?.map(app => app.id) || [];

    // Delete in correct order to handle dependencies
    
    // 1. Delete application_subject_faculty records
    let deletedFacultyAssignments = 0;
    if (applicationIds.length > 0) {
      const { error: facultyError, count } = await supabase
        .from('application_subject_faculty')
        .delete({ count: 'exact' })
        .in('application_id', applicationIds);

      if (facultyError) {
        console.error('Error deleting faculty assignments:', facultyError);
      } else {
        deletedFacultyAssignments = count || 0;
      }
    }

    // 2. Delete applications
    const { error: appError } = await supabase
      .from('applications')
      .delete()
      .eq('batch', batchName);

    if (appError) {
      console.error('Error deleting applications:', appError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete applications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get student IDs and delete auth users
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('batch', batchName);

    const studentIds = students?.map(s => s.id) || [];

    // Delete auth users (this will cascade delete profiles via foreign key)
    for (const studentId of studentIds) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(studentId);
      if (deleteError) {
        console.error(`Error deleting user ${studentId}:`, deleteError);
      }
    }

    // 4. Delete batch record
    const { error: batchDeleteError } = await supabase
      .from('batches')
      .delete()
      .eq('name', batchName);

    if (batchDeleteError) {
      console.error('Error deleting batch:', batchDeleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete batch' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'DELETE_BATCH',
      table_name: 'batches',
      record_id: batch.id,
      metadata: {
        batch_name: batchName,
        students_deleted: studentCount || 0,
        applications_deleted: applicationCount || 0,
        faculty_assignments_deleted: deletedFacultyAssignments
      }
    });

    console.log('Batch deleted successfully:', {
      batchName,
      students: studentCount || 0,
      applications: applicationCount || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        deleted: {
          batch: batchName,
          students: studentCount || 0,
          applications: applicationCount || 0,
          faculty_assignments: deletedFacultyAssignments
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
