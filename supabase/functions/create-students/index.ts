import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

interface StudentData {
  name: string
  usn: string
  department: string
  batch: string
}

// Validation schema for student data
const studentSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),
  usn: z.string()
    .trim()
    .regex(/^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2,4}[0-9]{3}$/, 'Invalid USN format (e.g., 4NI21CS001)'),
  department: z.enum(['MECH', 'CSE', 'CIVIL', 'EC', 'AIML', 'CD'], {
    errorMap: () => ({ message: 'Invalid department' })
  }),
  batch: z.string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, 'Invalid batch format (e.g., 2021-25)')
})

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('Origin'));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      throw new Error('Unauthorized: Admin role required')
    }

    // Get students data from request
    const { students }: { students: StudentData[] } = await req.json()

    if (!students || students.length === 0) {
      throw new Error('No students provided')
    }

    // Validate all student data before processing
    const validationErrors: Array<{ usn: string; message: string }> = []
    const validatedStudents: StudentData[] = []

    for (const student of students) {
      try {
        const validated = studentSchema.parse(student)
        validatedStudents.push(validated)
      } catch (error: any) {
        const errorMessage = error.errors?.map((e: any) => e.message).join(', ') || 'Validation failed'
        validationErrors.push({
          usn: student.usn || 'unknown',
          message: errorMessage
        })
      }
    }

    // If any validation errors, return them immediately
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({
        success: [],
        errors: validationErrors
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const results: {
      success: string[]
      errors: Array<{ usn: string; message: string }>
    } = {
      success: [],
      errors: []
    }

    // Create each student (using validated data)
    for (const student of validatedStudents) {
      try {
        // Check for existing USN
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('usn')
          .eq('usn', student.usn)
          .maybeSingle()

        if (existingProfile) {
          results.errors.push({
            usn: student.usn,
            message: `USN ${student.usn} already exists`
          })
          continue
        }

        // Create auth user
        const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
          email: `${student.usn}@temp.edu`,
          password: student.usn,
          email_confirm: true,
          user_metadata: {
            name: student.name,
            usn: student.usn
          }
        })

        if (signUpError) throw signUpError

        if (authData.user) {
          // Create profile
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: authData.user.id,
              name: student.name,
              usn: student.usn,
              email: `${student.usn}@temp.edu`,
              department: student.department,
              batch: student.batch,
              semester: 1,
              profile_completed: false
            })

          if (profileError) throw profileError

          // Assign student role
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: authData.user.id,
              role: 'student'
            })

          if (roleError) throw roleError

          results.success.push(student.usn)
        }
      } catch (error: any) {
        results.errors.push({
          usn: student.usn,
          message: error.message
        })
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
