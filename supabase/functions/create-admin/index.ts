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
    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const adminEmail = 'admin@nodex.edu';
    const adminPassword = 'Admin@123456';

    console.log('Checking if admin user already exists...');

    // Check if admin user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users.find(u => u.email === adminEmail);

    if (existingAdmin) {
      console.log('Admin user already exists');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Admin user already exists',
          userId: existingAdmin.id,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('Creating new admin user...');

    // Create admin user using Supabase Auth Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: 'System Administrator',
      },
    });

    if (createError) {
      console.error('Error creating admin user:', createError);
      throw createError;
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned');
    }

    const userId = newUser.user.id;
    console.log('Admin user created with ID:', userId);

    // Create staff profile for admin
    const { error: profileError } = await supabaseAdmin
      .from('staff_profiles')
      .insert({
        id: userId,
        name: 'System Administrator',
        email: adminEmail,
        designation: 'System Administrator',
        employee_id: 'ADMIN001',
        is_active: true,
      });

    if (profileError) {
      console.error('Error creating staff profile:', profileError);
      throw profileError;
    }

    console.log('Staff profile created');

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
      });

    if (roleError) {
      console.error('Error assigning admin role:', roleError);
      throw roleError;
    }

    console.log('Admin role assigned');

    // Create audit log entry
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action: 'create_admin',
      table_name: 'staff_profiles',
      record_id: userId,
      metadata: {
        email: adminEmail,
        created_via: 'edge_function',
      },
    });

    console.log('Admin user setup completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin user created successfully',
        userId: userId,
        credentials: {
          email: adminEmail,
          password: '(check your setup documentation)',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    );
  } catch (error) {
    console.error('Error in create-admin function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
