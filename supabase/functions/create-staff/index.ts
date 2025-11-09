import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

const StaffSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email(),
  employee_id: z.string().trim().min(1),
  phone: z.string().trim().optional().nullable(),
  office_location: z.string().trim().optional().nullable(),
  date_of_joining: z.string().trim().optional().nullable(),
  designation: z.string().trim().optional().nullable(),
  department: z.string().trim().optional().nullable(),
  role: z.enum(['library','hostel','lab_instructor','college_office','faculty','hod','admin'])
})

type StaffInput = z.infer<typeof StaffSchema>

function generateSecurePassword(length = 16): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => charset[byte % charset.length]).join('')
}

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

    // Verify the requester
    const { data: userRes, error: getUserErr } = await adminClient.auth.getUser(token)
    if (getUserErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Ensure requester is admin
    const { data: isAdmin, error: roleErr } = await adminClient.rpc('has_role', { _user_id: userRes.user.id, _role: 'admin' })
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    const body: unknown = await req.json()
    const parsed = StaffSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const input: StaffInput = parsed.data

    // Create auth user with employee ID as password
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.employee_id,
      email_confirm: true,
      user_metadata: { name: input.name, employee_id: input.employee_id }
    })

    if (createErr || !created?.user) {
      return new Response(JSON.stringify({ error: createErr?.message || 'Failed to create auth user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const newUserId = created.user.id

    // Insert staff profile
    const { error: profileErr } = await adminClient.from('staff_profiles').insert({
      id: newUserId,
      name: input.name,
      email: input.email,
      employee_id: input.employee_id,
      phone: input.phone ?? null,
      office_location: input.office_location ?? null,
      date_of_joining: input.date_of_joining ?? null,
      designation: input.designation ?? null,
      department: input.department ?? null,
      is_active: true,
    })
    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Assign role
    const { error: roleAssignErr } = await adminClient.from('user_roles').insert({ user_id: newUserId, role: input.role as any })
    if (roleAssignErr) {
      return new Response(JSON.stringify({ error: roleAssignErr.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Audit log
    await adminClient.rpc('create_audit_log', {
      p_action: 'create_staff',
      p_table_name: 'staff_profiles',
      p_record_id: newUserId,
      p_metadata: { role: input.role }
    } as any)

    return new Response(JSON.stringify({ success: true, userId: newUserId, employeeId: input.employee_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || 'Unexpected error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
