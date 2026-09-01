import type { NextFunction, Request, Response } from 'express'
import { createUserClient } from '../lib/supabase.js'
import { asyncHandler, HttpError } from './error.js'
import type { ProfileRow } from '../types/express.js'

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) {
    throw new HttpError(401, 'Missing authorization token')
  }

  const supabase = createUserClient(token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    throw new HttpError(401, 'Invalid or expired token')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profileError) {
    throw new HttpError(400, profileError.message, profileError.code)
  }
  if (!profile) {
    throw new HttpError(403, 'Profile not found')
  }

  const typed = profile as ProfileRow
  if (typed.status === 'SUSPENDED') {
    throw new HttpError(403, 'Account suspended')
  }

  req.accessToken = token
  req.authUser = data.user
  req.profile = typed
  req.supabase = supabase
  next()
})

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.profile?.role !== 'ADMIN') {
    next(new HttpError(403, 'Admin access required'))
    return
  }
  next()
}
