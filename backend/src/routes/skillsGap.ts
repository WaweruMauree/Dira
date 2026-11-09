import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { getStudentContext, parsePaging, throwIfError } from '../lib/helpers.js'
import {
  buildOpportunitySkillsReport,
  buildSkillsAnalysisReport,
} from '../services/skillsAnalysisReport.js'
import { fetchAgentSourcedLearningLinks } from '../services/skillLearningLinks.js'
import { findLatestGapAnalysisForProfile } from '../lib/gapAnalysisLookup.js'

const analyzeSchema = z
  .object({
    opportunityId: z.number().int().optional(),
    targetRole: z.string().min(1).optional(),
  })
  .refine((v) => v.opportunityId || v.targetRole, {
    message: 'Provide opportunityId or targetRole',
  })

export const skillsGapRouter = Router()

skillsGapRouter.get(
  '/analyses',
  asyncHandler(async (req, res) => {
    const { studentProfile } = await getStudentContext(req)
    if (!studentProfile) throw new HttpError(400, 'Complete onboarding first')
    const profileId = (studentProfile as { profile_id: number }).profile_id
    const { limit, offset } = parsePaging(req)
    const { data, error, count } = await req.supabase
      .from('skills_gap_analyses')
      .select('*', { count: 'exact' })
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    throwIfError(error)
    res.json({ data: data ?? [], count: count ?? 0, limit, offset })
  })
)

skillsGapRouter.get(
  '/latest',
  asyncHandler(async (req, res) => {
    const { studentProfile } = await getStudentContext(req)
    if (!studentProfile) throw new HttpError(400, 'Complete onboarding first')
    const profileId = (studentProfile as { profile_id: number }).profile_id
    const targetRole =
      typeof req.query.targetRole === 'string' && req.query.targetRole.trim()
        ? req.query.targetRole.trim()
        : null

    const data = await findLatestGapAnalysisForProfile(req.supabase, profileId, targetRole)
    if (!data) {
      res.json({ data: null })
      return
    }
    res.json({
      data: {
        ...(typeof data.report === 'object' && data.report ? data.report : {}),
        saved: data,
        methodology: data.methodology,
      },
    })
  })
)

skillsGapRouter.post(
  '/agent-resources',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        targetRole: z.string().min(1).max(200),
        skills: z.array(z.string().min(1).max(120)).max(12).optional(),
      })
      .parse(req.body ?? {})

    const { studentProfile } = await getStudentContext(req)
    if (!studentProfile) throw new HttpError(400, 'Complete onboarding first')
    const profileId = (studentProfile as { profile_id: number }).profile_id

    let skillNames = body.skills?.map((s) => s.trim()).filter(Boolean)
    let prioritisedPlan: Array<{ skill?: string }> | undefined
    let gaps: string[] = []
    let upskills: string[] = []

    if (!skillNames?.length) {
      const { data: latest } = await req.supabase
        .from('skills_gap_analyses')
        .select('report')
        .eq('profile_id', profileId)
        .eq('target_role', body.targetRole.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const report =
        latest?.report && typeof latest.report === 'object'
          ? (latest.report as Record<string, unknown>)
          : null

      if (report) {
        prioritisedPlan = (report.prioritisedPlan as Array<{ skill?: string }>) ?? undefined
        gaps = (report.gaps as string[]) ?? []
        upskills = (report.upskills as string[]) ?? []
      }
    }

    const links = await fetchAgentSourcedLearningLinks({
      skills: skillNames?.length ? skillNames : undefined,
      prioritisedPlan,
      gaps,
      upskills,
    })

    res.json({
      data: {
        agentSourcedResources: links.agentSourcedResources,
        ...(links.agentSourcedResourcesMeta
          ? { agentSourcedResourcesMeta: links.agentSourcedResourcesMeta }
          : {}),
      },
    })
  })
)

skillsGapRouter.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const body = analyzeSchema.parse(req.body ?? {})
    const { studentProfile } = await getStudentContext(req)
    if (!studentProfile) {
      throw new HttpError(400, 'Complete onboarding before analyzing skills gaps')
    }
    const profileId = (studentProfile as { profile_id: number }).profile_id

    let report: Record<string, unknown>
    let methodology: Record<string, unknown>

    if (body.opportunityId) {
      const built = await buildOpportunitySkillsReport(req.supabase, profileId, body.opportunityId)
      report = built.report as Record<string, unknown>
      methodology = built.methodology as Record<string, unknown>
    } else {
      const built = await buildSkillsAnalysisReport(req.supabase, profileId, body.targetRole!)
      report = built.report as Record<string, unknown>
      methodology = built.methodology as Record<string, unknown>
    }

    const legacyRequired = (report.skills as Array<{ skillId: number; name: string }> | undefined)?.map(
      (s) => ({ skill_id: s.skillId, name: s.name })
    ) ?? []
    const gaps = (report.gaps as string[]) ?? []
    const prioritisedPlan = (report.prioritisedPlan as unknown[]) ?? []

    const insertRow: Record<string, unknown> = {
      profile_id: profileId,
      required_skills: legacyRequired,
      gaps,
      prioritised_plan: prioritisedPlan,
      report,
      methodology,
    }

    if (body.opportunityId) {
      insertRow.opportunity_id = body.opportunityId
    } else {
      insertRow.target_role = body.targetRole
      const pr = report.pathwayRole as { roleId?: number } | null
      if (pr?.roleId) insertRow.pathway_role_id = pr.roleId
    }

    const { data: saved, error: saveError } = await req.supabase
      .from('skills_gap_analyses')
      .insert(insertRow)
      .select('*')
      .single()

    if (saveError) {
      console.warn('[skills-gap/analyze] Could not persist analysis:', saveError.message, saveError.code)
      res.status(201).json({
        data: {
          ...report,
          methodology,
          saved: null,
          persistWarning:
            'Report generated but could not be saved. Apply migration 007_skills_gap_role_report.sql for persistence.',
        },
      })
      return
    }

    res.status(201).json({
      data: {
        ...report,
        methodology,
        saved,
      },
    })
  })
)
