import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { parsePaging, throwIfError } from '../lib/helpers.js'

const jobInput = z.object({
  externalId: z.union([z.string(), z.number()]).transform(String),
  source: z.string().min(1),
  title: z.string().min(1).max(255),
  organisation: z.string().max(200).nullable().optional(),
  description: z.string().nullable().optional(),
  location: z.string().max(150).nullable().optional(),
  url: z.string().nullable().optional(),
  employmentType: z.string().nullable().optional(),
  experienceLevel: z.number().int().min(1).max(5).nullable().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  salaryCurrency: z.string().max(10).nullable().optional(),
  salaryPeriod: z.string().nullable().optional(),
  salaryText: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  raw: z.record(z.unknown()).optional(),
  saved: z.boolean().optional(),
})

const batchSchema = z.object({
  jobs: z.array(jobInput).min(1).max(100),
})

function toIso(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function toRow(job: z.infer<typeof jobInput>, userId: string) {
  return {
    user_id: userId,
    external_id: job.externalId,
    source: job.source,
    title: job.title,
    organisation: job.organisation ?? null,
    description: job.description ?? null,
    location: job.location ?? null,
    url: job.url ?? null,
    employment_type: job.employmentType ?? null,
    experience_level: job.experienceLevel ?? null,
    salary_min: job.salaryMin ?? null,
    salary_max: job.salaryMax ?? null,
    salary_currency: job.salaryCurrency ?? null,
    salary_period: job.salaryPeriod ?? null,
    salary_text: job.salaryText ?? null,
    published_at: toIso(job.publishedAt),
    tags: job.tags ?? [],
    saved: job.saved ?? false,
    raw: job.raw ?? {},
  }
}

export const userJobsRouter = Router()

userJobsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaging(req)
    let query = req.supabase
      .from('user_jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', req.authUser.id)
      .order('fetched_at', { ascending: false })

    if (req.query.saved === 'true') query = query.eq('saved', true)
    if (typeof req.query.source === 'string') query = query.eq('source', req.query.source)
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      query = query.or(`title.ilike.%${req.query.q.trim()}%,organisation.ilike.%${req.query.q.trim()}%`)
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)
    throwIfError(error)
    res.json({ data: data ?? [], count: count ?? 0, limit, offset })
  })
)

userJobsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { jobs } = batchSchema.parse(req.body)
    const rows = jobs.map((job) => toRow(job, req.authUser.id))
    const { data, error } = await req.supabase
      .from('user_jobs')
      .upsert(rows, { onConflict: 'user_id,source,external_id' })
      .select('*')
    throwIfError(error)
    res.status(201).json({ data: data ?? [] })
  })
)

userJobsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().parse(req.params.id)
    const { data, error } = await req.supabase.from('user_jobs').select('*').eq('id', id).maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'Job not found')
    res.json({ data })
  })
)

userJobsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().parse(req.params.id)
    const body = z
      .object({
        saved: z.boolean().optional(),
        title: z.string().min(1).max(255).optional(),
      })
      .parse(req.body ?? {})
    const { data, error } = await req.supabase
      .from('user_jobs')
      .update(body)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'Job not found')
    res.json({ data })
  })
)

userJobsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().parse(req.params.id)
    const { data, error } = await req.supabase.from('user_jobs').delete().eq('id', id).select('id').maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'Job not found')
    res.status(204).send()
  })
)
