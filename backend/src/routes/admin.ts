import { Router } from 'express'
import type { Request } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { parsePaging, throwIfError } from '../lib/helpers.js'
import { requireAdmin } from '../middleware/auth.js'

export const adminRouter = Router()

adminRouter.use(requireAdmin)

async function resolveAdminId(req: Request): Promise<number> {
  const { data, error } = await req.supabase
    .from('admins')
    .select('id')
    .eq('user_id', req.authUser!.id)
    .maybeSingle()
  throwIfError(error)
  if (!data) throw new HttpError(403, 'Admin record not found')
  return data.id as number
}

async function writeAuditLog(
  req: Request,
  action: string,
  targetEntity: string | null,
  targetId: number | null
) {
  const adminId = await resolveAdminId(req)
  const { error } = await req.supabase.from('audit_logs').insert({
    admin_id: adminId,
    action,
    target_entity: targetEntity,
    target_id: targetId,
  })
  throwIfError(error)
}

adminRouter.get(
  '/dashboard/summary',
  asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const [
      studentsRes,
      pendingSubRes,
      pendingOppRes,
      suspendedRes,
      sessionsRes,
    ] = await Promise.all([
      req.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT'),
      req.supabase
        .from('community_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING'),
      req.supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      req.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'SUSPENDED'),
      req.supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', since),
    ])

    throwIfError(studentsRes.error)
    throwIfError(pendingSubRes.error)
    throwIfError(pendingOppRes.error)
    throwIfError(suspendedRes.error)
    throwIfError(sessionsRes.error)

    const pendingListings = (pendingSubRes.count ?? 0) + (pendingOppRes.count ?? 0)

    res.json({
      data: {
        totalStudents: studentsRes.count ?? 0,
        pendingListings,
        flaggedItems: suspendedRes.count ?? 0,
        activeSessions: sessionsRes.count ?? 0,
      },
    })
  })
)

adminRouter.get(
  '/dashboard/pending-reviews',
  asyncHandler(async (req, res) => {
    const { limit } = parsePaging(req)
    const cap = Math.min(limit, 50)

    const { data: submissions, error: subErr } = await req.supabase
      .from('community_submissions')
      .select('submission_id, title, type, description, status, created_at')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(cap)
    throwIfError(subErr)

    const { data: opportunities, error: oppErr } = await req.supabase
      .from('opportunities')
      .select('opportunity_id, title, description, status, created_at, source_id, opportunity_sources (name)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(cap)
    throwIfError(oppErr)

    type Row = {
      id: number
      entityType: 'community_submission' | 'opportunity'
      title: string
      source: string
      flagReason: string
      createdAt: string
    }

    const rows: Row[] = []

    for (const s of submissions ?? []) {
      const desc = (s.description as string | null) ?? ''
      rows.push({
        id: s.submission_id as number,
        entityType: 'community_submission',
        title: s.title as string,
        source: 'Community',
        flagReason: (s.type as string) || desc.slice(0, 80) || 'Pending review',
        createdAt: s.created_at as string,
      })
    }

    for (const o of opportunities ?? []) {
      const src = (o.opportunity_sources as { name?: string } | null)?.name ?? 'Catalog'
      const desc = (o.description as string | null) ?? ''
      rows.push({
        id: o.opportunity_id as number,
        entityType: 'opportunity',
        title: o.title as string,
        source: src,
        flagReason: desc.slice(0, 80) || 'Pending approval',
        createdAt: o.created_at as string,
      })
    }

    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json({ data: rows.slice(0, cap) })
  })
)

const entityParam = z.object({
  entityType: z.enum(['community_submission', 'opportunity']),
  id: z.coerce.number().int().positive(),
})

async function setReviewStatus(
  req: Request,
  entityType: 'community_submission' | 'opportunity',
  id: number,
  status: 'APPROVED' | 'REJECTED'
) {
  if (entityType === 'community_submission') {
    const { data, error } = await req.supabase
      .from('community_submissions')
      .update({ status })
      .eq('submission_id', id)
      .select('submission_id')
      .maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'Submission not found')
    await writeAuditLog(req, `${status} community submission`, 'community_submissions', id)
    return
  }

  const { data, error } = await req.supabase
    .from('opportunities')
    .update({ status })
    .eq('opportunity_id', id)
    .select('opportunity_id')
    .maybeSingle()
  throwIfError(error)
  if (!data) throw new HttpError(404, 'Opportunity not found')
  await writeAuditLog(req, `${status} opportunity`, 'opportunities', id)
}

adminRouter.post(
  '/dashboard/reviews/:entityType/:id/approve',
  asyncHandler(async (req, res) => {
    const { entityType, id } = entityParam.parse(req.params)
    await setReviewStatus(req, entityType, id, 'APPROVED')
    res.json({ data: { ok: true } })
  })
)

adminRouter.post(
  '/dashboard/reviews/:entityType/:id/reject',
  asyncHandler(async (req, res) => {
    const { entityType, id } = entityParam.parse(req.params)
    await setReviewStatus(req, entityType, id, 'REJECTED')
    res.json({ data: { ok: true } })
  })
)

adminRouter.get(
  '/students',
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaging(req)
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

    let query = req.supabase
      .from('profiles')
      .select(
        'id, full_name, phone_number, username, status, created_at, students ( course, student_profiles ( onboarded ) )',
        { count: 'exact' }
      )
      .eq('role', 'STUDENT')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
    }

    const { data, error, count } = await query
    throwIfError(error)

    const rows = (data ?? []).map((p) => {
      const student = Array.isArray(p.students) ? p.students[0] : p.students
      const spRaw = student
        ? Array.isArray((student as { student_profiles?: unknown }).student_profiles)
          ? (student as { student_profiles: unknown[] }).student_profiles[0]
          : (student as { student_profiles?: { onboarded?: boolean } }).student_profiles
        : null
      return {
        userId: p.id,
        fullName: p.full_name,
        username: p.username,
        phoneNumber: p.phone_number,
        status: p.status,
        course: (student as { course?: string } | null)?.course ?? null,
        onboarded: Boolean((spRaw as { onboarded?: boolean } | null)?.onboarded),
        createdAt: p.created_at,
      }
    })

    res.json({ data: rows, count: count ?? 0, limit, offset })
  })
)

const statusBody = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) })

adminRouter.patch(
  '/students/:userId/status',
  asyncHandler(async (req, res) => {
    const userId = z.string().uuid().parse(req.params.userId)
    const { status } = statusBody.parse(req.body ?? {})

    const { data, error } = await req.supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId)
      .eq('role', 'STUDENT')
      .select('id, status')
      .maybeSingle()
    throwIfError(error)
    if (!data) throw new HttpError(404, 'Student not found')

    await writeAuditLog(req, `Set student status ${status}`, 'profiles', null)

    res.json({ data })
  })
)

adminRouter.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaging(req)
    const { data, error, count } = await req.supabase
      .from('audit_logs')
      .select('log_id, action, target_entity, target_id, timestamp, admin_id')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)
    throwIfError(error)

    res.json({ data: data ?? [], count: count ?? 0, limit, offset })
  })
)

adminRouter.get(
  '/usage-report',
  asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const counts = await Promise.all([
      req.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'STUDENT'),
      req.supabase.from('conversations').select('*', { count: 'exact', head: true }),
      req.supabase.from('conversations').select('*', { count: 'exact', head: true }).gte('created_at', since),
      req.supabase.from('user_jobs').select('*', { count: 'exact', head: true }),
      req.supabase.from('skills_gap_analyses').select('*', { count: 'exact', head: true }),
      req.supabase.from('saved_opportunities').select('*', { count: 'exact', head: true }),
    ])

    for (const r of counts) throwIfError(r.error)

    res.json({
      data: {
        totalStudents: counts[0].count ?? 0,
        totalConversations: counts[1].count ?? 0,
        conversationsLast30Days: counts[2].count ?? 0,
        totalUserJobs: counts[3].count ?? 0,
        totalSkillsAnalyses: counts[4].count ?? 0,
        totalSavedOpportunities: counts[5].count ?? 0,
      },
    })
  })
)

adminRouter.get(
  '/system/performance',
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaging(req)
    const { data, error, count } = await req.supabase
      .from('aggregation_runs')
      .select('id, started_at, finished_at, status, items_found, errors, opportunity_sources (name)', {
        count: 'exact',
      })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)
    throwIfError(error)

    res.json({ data: data ?? [], count: count ?? 0, limit, offset })
  })
)
