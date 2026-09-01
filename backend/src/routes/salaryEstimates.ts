import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { parsePaging, throwIfError } from '../lib/helpers.js'

const createSchema = z.object({
  query: z.string().min(1).max(255),
  location: z.string().max(150).optional().nullable(),
  currency: z.string().max(10).optional().nullable(),
  min: z.number().nullable().optional(),
  median: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
  sampleSize: z.number().int().min(0).optional(),
  source: z.string().optional().nullable(),
  histogram: z.record(z.unknown()).optional(),
})

export const salaryEstimatesRouter = Router()

salaryEstimatesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaging(req)
    const { data, error, count } = await req.supabase
      .from('salary_estimates')
      .select('*', { count: 'exact' })
      .eq('user_id', req.authUser.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    throwIfError(error)
    res.json({ data: data ?? [], count: count ?? 0, limit, offset })
  })
)

salaryEstimatesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body)
    const { data, error } = await req.supabase
      .from('salary_estimates')
      .insert({
        user_id: req.authUser.id,
        query: body.query,
        location: body.location ?? null,
        currency: body.currency ?? null,
        min: body.min ?? null,
        median: body.median ?? null,
        max: body.max ?? null,
        sample_size: body.sampleSize ?? 0,
        source: body.source ?? null,
        histogram: body.histogram ?? {},
      })
      .select('*')
      .single()
    throwIfError(error)
    res.status(201).json({ data })
  })
)

salaryEstimatesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().parse(req.params.id)
    const { data, error } = await req.supabase.from('salary_estimates').select('*').eq('id', id).maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'Estimate not found')
    res.json({ data })
  })
)
