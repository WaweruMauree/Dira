import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export class HttpError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function supabaseError(error: { message: string; code?: string; details?: string }) {
  const code = error.code ?? ''
  if (code === 'PGRST205') {
    return new HttpError(503, 'Required table is missing — apply supabase/migrations/004_conversations.sql on the live project', code)
  }
  if (code === 'PGRST116') {
    return new HttpError(404, 'Not found', code)
  }
  if (code === '42501' || error.message.toLowerCase().includes('row-level security')) {
    const detail =
      error.message && !/row-level security/i.test(error.message)
        ? error.message
        : 'Database permission denied (row-level security).'
    return new HttpError(403, detail, code, error.details)
  }
  if (code === '23505') {
    return new HttpError(409, 'Already exists', code, error.details)
  }
  if (code === '23503') {
    return new HttpError(400, 'Invalid reference', code, error.details)
  }
  return new HttpError(400, error.message, code, error.details)
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten(),
    })
    return
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      message: err.message,
      code: err.code,
      details: err.details,
    })
    return
  }

  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
}
