import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

const FacultySchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  employee_id: z.string().trim().min(1),
  department: z.string().trim().min(1),
  designation: z.string().trim().min(1),
  role: z.enum(['faculty', 'hod'])
})

type FacultyInput = z.infer<typeof FacultySchema>

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'))

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(url, serviceKey, { auth: { persistSession: false } })

    // Verify the requester is admin
    const { data: userRes, error: getUserErr } = await adminClient.auth.getUser(token)
    if (getUserErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { data: isAdmin, error: roleErr } = await adminClient.rpc('has_role', { _user_id: userRes.user.id, _role: 'admin' })
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const body: unknown = await req.json()
    const parsed = FacultySchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const input: FacultyInput = parsed.data

    console.log('Creating faculty with data:', input)

    // Create auth user with employee ID as password
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.employee_id,
      email_confirm: true,
      user_metadata: { name: input.name, employee_id: input.employee_id }
    })

    if (createErr || !created?.user) {
      console.error('Auth user creation failed:', createErr)
      return new Response(JSON.stringify({ error: createErr?.message || 'Failed to create auth user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const newUserId = created.user.id
    console.log('Auth user created:', newUserId)

    // Insert staff profile
    const { error: profileErr } = await adminClient.from('staff_profiles').insert({
      id: newUserId,
      name: input.name,
      email: input.email,
      employee_id: input.employee_id,
      department: input.department,
      designation: input.designation,
      date_of_joining: new Date().toISOString().split('T')[0],
      is_active: true,
    })

    if (profileErr) {
      console.error('Profile insertion failed:', profileErr)
      return new Response(JSON.stringify({ error: profileErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log('Staff profile created')

    // Assign role
    const { error: roleAssignErr } = await adminClient.from('user_roles').insert({ 
      user_id: newUserId, 
      role: input.role 
    })

    if (roleAssignErr) {
      console.error('Role assignment failed:', roleAssignErr)
      return new Response(JSON.stringify({ error: roleAssignErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log('Role assigned:', input.role)

    // Create audit log
    await adminClient.rpc('create_audit_log', {
      p_action: 'create_faculty',
      p_table_name: 'staff_profiles',
      p_record_id: newUserId,
      p_metadata: { role: input.role, department: input.department, designation: input.designation }
    } as any)

    console.log('Faculty creation completed successfully')

    return new Response(JSON.stringify({ 
      success: true, 
      userId: newUserId, 
      employeeId: input.employee_id,
      loginId: input.email
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message || 'Unexpected error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
