import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { parsePaging, throwIfError } from '../lib/helpers.js'

const createSchema = z.object({
  title: z.string().min(1).max(255).default('Resume'),
  targetJobId: z.number().int().optional().nullable(),
  resume: z.record(z.unknown()),
})

export const cvsRouter = Router()

cvsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaging(req)
    const { data, error, count } = await req.supabase
      .from('student_cvs')
      .select('*', { count: 'exact' })
      .eq('user_id', req.authUser.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)
    throwIfError(error)
    res.json({ data: data ?? [], count: count ?? 0, limit, offset })
  })
)

cvsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body)
    const { data, error } = await req.supabase
      .from('student_cvs')
      .insert({
        user_id: req.authUser.id,
        title: body.title,
        target_job_id: body.targetJobId ?? null,
        resume: body.resume,
      })
      .select('*')
      .single()
    throwIfError(error)
    res.status(201).json({ data })
  })
)

cvsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().parse(req.params.id)
    const { data, error } = await req.supabase.from('student_cvs').select('*').eq('id', id).maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'CV not found')
    res.json({ data })
  })
)

cvsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().parse(req.params.id)
    const body = createSchema.partial().parse(req.body ?? {})
    const patch: Record<string, unknown> = {}
    if (body.title !== undefined) patch.title = body.title
    if (body.targetJobId !== undefined) patch.target_job_id = body.targetJobId
    if (body.resume !== undefined) patch.resume = body.resume
    const { data, error } = await req.supabase
      .from('student_cvs')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'CV not found')
    res.json({ data })
  })
)

cvsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().parse(req.params.id)
    const { data, error } = await req.supabase.from('student_cvs').delete().eq('id', id).select('id').maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'CV not found')
    res.status(204).send()
  })
)
