import type { Request } from 'express'
import { supabaseError } from '../middleware/error.js'

export function parsePaging(req: Request) {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50))
  const offset = Math.max(0, Number(req.query.offset) || 0)
  return { limit, offset }
}

export function throwIfError(error: { message: string; code?: string; details?: string } | null) {
  if (error) throw supabaseError(error)
}

export async function getStudentContext(req: Request) {
  const { data: student, error: studentError } = await req.supabase
    .from('students')
    .select('*')
    .eq('user_id', req.authUser.id)
    .maybeSingle()
  throwIfError(studentError)

  if (!student) {
    return { student: null, studentProfile: null as Record<string, unknown> | null }
  }

  const { data: studentProfile, error: profileError } = await req.supabase
    .from('student_profiles')
    .select('*')
    .eq('student_id', student.id)
    .maybeSingle()
  throwIfError(profileError)

  return { student, studentProfile }
}
