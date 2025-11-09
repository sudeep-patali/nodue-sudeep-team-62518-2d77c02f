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
        JSON.stringify({ error: 'Only admins can create batches' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { batchName } = await req.json();

    // Validate batch name format (YYYY-YY)
    const batchPattern = /^(\d{4})-(\d{2})$/;
    const match = batchName.match(batchPattern);

    if (!match) {
      return new Response(
        JSON.stringify({ error: 'Invalid batch format. Use YYYY-YY (e.g., 2024-28)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startYear = parseInt(match[1]);
    const endYearShort = parseInt(match[2]);
    const endYear = 2000 + endYearShort;

    // Validate years
    const currentYear = new Date().getFullYear();
    if (startYear > currentYear + 1) {
      return new Response(
        JSON.stringify({ error: 'Start year cannot be more than 1 year in the future' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (endYear <= startYear) {
      return new Response(
        JSON.stringify({ error: 'End year must be after start year' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate batch
    const { data: existingBatch } = await supabase
      .from('batches')
      .select('id')
      .eq('name', batchName)
      .single();

    if (existingBatch) {
      return new Response(
        JSON.stringify({ error: 'Batch already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new batch
    const { data: newBatch, error: insertError } = await supabase
      .from('batches')
      .insert({
        name: batchName,
        start_year: startYear,
        end_year: endYear,
        current_semester: 1
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating batch:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create batch' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'CREATE_BATCH',
      table_name: 'batches',
      record_id: newBatch.id,
      metadata: { batch_name: batchName }
    });

    console.log('Batch created successfully:', batchName);

    return new Response(
      JSON.stringify({ 
        success: true, 
        batch: newBatch 
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
