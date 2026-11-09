import type { User } from '@supabase/supabase-js'
import { createServiceClient } from './supabase.js'
import { env } from '../config/env.js'
import { HttpError } from '../middleware/error.js'
import { throwIfError } from './helpers.js'

/** Backfill profiles/students/admins when auth user exists but handle_new_user did not run. */
export async function ensureProfileForAuthUser(authUser: User): Promise<void> {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new HttpError(
      403,
      'Profile not found. Set SUPABASE_SERVICE_ROLE_KEY on the backend and ensure handle_new_user trigger is applied in Supabase.'
    )
  }

  const service = createServiceClient()
  const userId = authUser.id

  const { data: existing, error: existsErr } = await service
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  throwIfError(existsErr)
  if (existing) return

  const meta = authUser.user_metadata ?? {}
  const roleRaw = typeof meta.role === 'string' ? meta.role.toUpperCase() : 'STUDENT'
  const assignedRole = roleRaw === 'ADMIN' ? 'ADMIN' : 'STUDENT'
  const email = authUser.email ?? undefined

  const normalizedEmail =
    email && email.trim() ? email.trim().toLowerCase() : null

  const fullName =
    typeof meta.full_name === 'string' && meta.full_name.trim()
      ? meta.full_name.trim()
      : typeof meta.name === 'string' && meta.name.trim()
        ? meta.name.trim()
        : null

  const { error: profileErr } = await service.from('profiles').insert({
    id: userId,
    email: normalizedEmail,
    phone_number: typeof meta.phone_number === 'string' ? meta.phone_number : null,
    full_name: fullName,
    role: assignedRole,
    status: 'ACTIVE',
  })
  if (profileErr && profileErr.code !== '23505') {
    throwIfError(profileErr)
  }

  if (assignedRole === 'STUDENT') {
    const { error: studentErr } = await service.from('students').insert({
      user_id: userId,
      course: typeof meta.course === 'string' ? meta.course : null,
    })
    if (studentErr && studentErr.code !== '23505') {
      throwIfError(studentErr)
    }
  } else if (assignedRole === 'ADMIN') {
    const { error: adminErr } = await service.from('admins').insert({ user_id: userId })
    if (adminErr && adminErr.code !== '23505') {
      throwIfError(adminErr)
    }
  }
}
