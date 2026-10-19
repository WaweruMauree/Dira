import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { parsePaging, throwIfError } from '../lib/helpers.js'
import { mergeRawWithFilterMeta } from '../lib/jobClassifiers.js'
import { truncateTags, truncateVarchar } from '../lib/truncate.js'
import {
  jobsToDbRows,
  loadRecommendContext,
  recommendJobsForStudent,
} from '../services/jobRecommendations.js'

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
    source: truncateVarchar(job.source, 100) ?? job.source,
    title: truncateVarchar(job.title, 255) ?? 'Untitled role',
    organisation: truncateVarchar(job.organisation ?? null, 200),
    description: job.description ?? null,
    location: truncateVarchar(job.location ?? null, 150),
    url: job.url ?? null,
    employment_type: job.employmentType ?? null,
    experience_level: job.experienceLevel ?? null,
    salary_min: job.salaryMin ?? null,
    salary_max: job.salaryMax ?? null,
    salary_currency: truncateVarchar(job.salaryCurrency ?? null, 10),
    salary_period: job.salaryPeriod ?? null,
    salary_text: job.salaryText ?? null,
    published_at: toIso(job.publishedAt),
    tags: truncateTags(job.tags),
    saved: job.saved ?? false,
    raw: mergeRawWithFilterMeta(job.raw, {
      title: job.title,
      description: job.description,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
    }),
  }
}

export const userJobsRouter = Router()

const SIX_HOURS_MS = 6 * 60 * 60 * 1000

userJobsRouter.post(
  '/recommend',
  asyncHandler(async (req, res) => {
    const force = req.query.force === 'true'
    const ctx = await loadRecommendContext(req.supabase, req.authUser.id)
    if (!ctx) {
      throw new HttpError(403, 'Complete onboarding to get personalized job recommendations.')
    }

    if (!force) {
      const { data: recent } = await req.supabase
        .from('user_jobs')
        .select('fetched_at')
        .eq('user_id', req.authUser.id)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (recent?.fetched_at) {
        const age = Date.now() - new Date(String(recent.fetched_at)).getTime()
        if (age < SIX_HOURS_MS) {
          const { data: existing } = await req.supabase
            .from('user_jobs')
            .select('*')
            .eq('user_id', req.authUser.id)
            .order('fetched_at', { ascending: false })
            .limit(50)
          const sorted = sortByRelevance(existing ?? [])
          return res.json({ data: sorted, cached: true })
        }
      }
    }

    const jobs = await recommendJobsForStudent(ctx)
    const rows = jobsToDbRows(jobs, req.authUser.id)
    if (rows.length > 0) {
      const { error } = await req.supabase.from('user_jobs').upsert(rows, {
        onConflict: 'user_id,source,external_id',
      })
      throwIfError(error)
    }

    const { data: stored, error: loadError } = await req.supabase
      .from('user_jobs')
      .select('*')
      .eq('user_id', req.authUser.id)
      .order('fetched_at', { ascending: false })
      .limit(50)
    throwIfError(loadError)
    res.status(201).json({ data: sortByRelevance(stored ?? []), cached: false })
  })
)

userJobsRouter.get(
  '/feed',
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaging(req)
    const { data, error } = await req.supabase
      .from('user_jobs')
      .select('*', { count: 'exact' })
      .eq('user_id', req.authUser.id)
      .order('fetched_at', { ascending: false })
      .range(0, 199)
    throwIfError(error)
    const sorted = sortByRelevance(data ?? [])
    const page = sorted.slice(offset, offset + limit)
    res.json({ data: page, count: sorted.length, limit, offset })
  })
)

function sortByRelevance(rows: Record<string, unknown>[]) {
  return [...rows].sort((a, b) => {
    const ra = Number((a.raw as Record<string, unknown>)?.relevanceScore ?? 0)
    const rb = Number((b.raw as Record<string, unknown>)?.relevanceScore ?? 0)
    if (rb !== ra) return rb - ra
    return String(b.fetched_at ?? '').localeCompare(String(a.fetched_at ?? ''))
  })
}

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
  '/views',
  asyncHandler(async (req, res) => {
    const { data, error } = await req.supabase
      .from('user_job_views')
      .select('*')
      .eq('user_id', req.authUser.id)
      .order('viewed_at', { ascending: false })
      .limit(100)
    throwIfError(error)
    res.json({ data: data ?? [] })
  })
)

userJobsRouter.post(
  '/:id/view',
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().parse(req.params.id)
    const { data: job, error: jobError } = await req.supabase
      .from('user_jobs')
      .select('id, title, organisation, url, source')
      .eq('id', id)
      .eq('user_id', req.authUser.id)
      .maybeSingle()
    throwIfError(jobError)
    if (!job) throw new HttpError(404, 'Job not found')
    if (!job.url) throw new HttpError(400, 'Job has no listing URL')

    const row = {
      user_id: req.authUser.id,
      user_job_id: job.id,
      title: job.title,
      organisation: job.organisation,
      url: job.url,
      source: job.source,
    }
    const { data, error } = await req.supabase.from('user_job_views').insert(row).select('*').single()
    throwIfError(error)
    res.status(201).json({ data })
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
