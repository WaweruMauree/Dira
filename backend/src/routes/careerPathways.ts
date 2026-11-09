import { Router, type Request } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { getStudentContext, throwIfError } from '../lib/helpers.js'
import { generateCareerPathwayRoadmap } from '../services/generateCareerPathwayRoadmap.js'
import {
  computeProgressSummary,
  mergePathwaySteps,
  pathwayStepSchema,
  roadmapDataSchema,
  type RoadmapData,
} from '../types/careerPathwayRoadmap.js'
import { resolvePathwayRole } from '../services/skillsAnalysisReport.js'
import { findLatestGapAnalysisForProfile } from '../lib/gapAnalysisLookup.js'
import { normalizeTargetRole } from '../lib/targetRole.js'
import { ensureGapAnalysisForRole } from '../services/ensureGapAnalysisForRole.js'

export const careerPathwaysRouter = Router()

const generateBodySchema = z.object({
  targetRole: z.string().min(1).max(200).optional(),
})

const patchBodySchema = z.object({
  roadmapData: z
    .object({
      steps: z.array(pathwayStepSchema.partial().extend({ id: z.string().min(1) })).optional(),
      targetRole: z.string().min(1).optional(),
    })
    .optional(),
  steps: z.array(pathwayStepSchema.partial().extend({ id: z.string().min(1) })).optional(),
})

async function loadLatestGapAnalysis(req: Request, profileId: number, targetRole: string | null) {
  return findLatestGapAnalysisForProfile(req.supabase, profileId, targetRole)
}

function normalizeRoleLabel(value: string): string {
  return normalizeTargetRole(value)
}

function pathwayRowToResponse(data: Record<string, unknown>) {
  return {
    pathwayId: data.pathway_id,
    profileId: data.profile_id,
    targetRoleId: data.target_role_id,
    roadmapData: data.roadmap_data,
    generatedAt: data.generated_at,
  }
}

function reportFromAnalysisRow(row: Record<string, unknown>): Record<string, unknown> {
  const report = row.report
  if (typeof report === 'object' && report !== null) return report as Record<string, unknown>
  return {
    targetRole: row.target_role,
    prioritisedPlan: row.prioritised_plan,
    gaps: row.gaps,
  }
}

careerPathwaysRouter.get(
  '/current',
  asyncHandler(async (req, res) => {
    const { studentProfile } = await getStudentContext(req)
    if (!studentProfile) throw new HttpError(400, 'Complete onboarding first')
    const profileId = (studentProfile as { profile_id: number }).profile_id

    const targetRole =
      typeof req.query.targetRole === 'string' && req.query.targetRole.trim()
        ? req.query.targetRole.trim()
        : null

    let query = req.supabase
      .from('career_pathways')
      .select('*')
      .eq('profile_id', profileId)
      .order('generated_at', { ascending: false })
      .limit(1)

    if (targetRole) {
      const resolved = await resolvePathwayRole(req.supabase, targetRole)
      if (resolved) query = query.eq('target_role_id', resolved.role_id)
    }

    let { data, error } = await query.maybeSingle()
    throwIfError(error)

    if (!data && targetRole) {
      const needle = normalizeRoleLabel(targetRole)
      const { data: recent, error: recentErr } = await req.supabase
        .from('career_pathways')
        .select('*')
        .eq('profile_id', profileId)
        .order('generated_at', { ascending: false })
        .limit(24)
      throwIfError(recentErr)
      data =
        (recent ?? []).find((row) => {
          const rd = row.roadmap_data as { targetRole?: string } | null
          const label =
            typeof rd?.targetRole === 'string'
              ? rd.targetRole
              : typeof row.target_role_id === 'number'
                ? ''
                : ''
          return label && normalizeRoleLabel(label) === needle
        }) ?? null
    }

    if (!data) {
      res.json({ data: null })
      return
    }

    res.json({ data: pathwayRowToResponse(data as Record<string, unknown>) })
  })
)

careerPathwaysRouter.post(
  '/generate',
  asyncHandler(async (req, res) => {
    const body = generateBodySchema.parse(req.body ?? {})
    const { studentProfile } = await getStudentContext(req)
    if (!studentProfile) throw new HttpError(400, 'Complete onboarding first')
    const profileId = (studentProfile as { profile_id: number }).profile_id

    const targetRoleParam = body.targetRole?.trim() ?? null
    let analysis: Record<string, unknown>
    let report: Record<string, unknown>
    let analysisCreated = false

    if (targetRoleParam) {
      const ensured = await ensureGapAnalysisForRole(req.supabase, profileId, targetRoleParam)
      analysis = ensured.analysis
      report = ensured.report
      analysisCreated = ensured.created
    } else {
      const row = await loadLatestGapAnalysis(req, profileId, null)
      if (!row) {
        throw new HttpError(400, 'No skills analysis found. Complete skills analysis before generating a pathway.')
      }
      analysis = row as Record<string, unknown>
      report = reportFromAnalysisRow(analysis)
    }
    const targetRole =
      targetRoleParam ||
      (typeof report.targetRole === 'string' && report.targetRole.trim()) ||
      (typeof analysis.target_role === 'string' ? analysis.target_role : null) ||
      'Career goal'

    let pathwayRoleId: number | null =
      typeof analysis.pathway_role_id === 'number' ? analysis.pathway_role_id : null
    const pr = report.pathwayRole as { roleId?: number | null } | undefined
    if (pr?.roleId) pathwayRoleId = pr.roleId

    if (!pathwayRoleId) {
      const resolved = await resolvePathwayRole(req.supabase, targetRole)
      if (!resolved) {
        throw new HttpError(400, 'Could not match a pathway role for this target. Try skills analysis again.')
      }
      pathwayRoleId = resolved.role_id
    }

    const roadmapData = await generateCareerPathwayRoadmap({
      report: { ...report, targetRole },
      sourceAnalysisId: typeof analysis.analysis_id === 'number' ? analysis.analysis_id : null,
      pathwayRoleId,
    })

    const { data: inserted, error: insertErr } = await req.supabase
      .from('career_pathways')
      .insert({
        profile_id: profileId,
        target_role_id: pathwayRoleId,
        roadmap_data: roadmapData,
        generated_at: roadmapData.generatedAt,
      })
      .select('*')
      .single()

    throwIfError(insertErr)

    res.status(201).json({
      data: {
        pathwayId: inserted.pathway_id,
        profileId: inserted.profile_id,
        targetRoleId: inserted.target_role_id,
        roadmapData: inserted.roadmap_data,
        generatedAt: inserted.generated_at,
        ...(analysisCreated ? { analysisCreated: true } : {}),
      },
    })
  })
)

careerPathwaysRouter.patch(
  '/:pathwayId',
  asyncHandler(async (req, res) => {
    const pathwayId = z.coerce.number().int().positive().parse(req.params.pathwayId)
    const body = patchBodySchema.parse(req.body ?? {})

    const { studentProfile } = await getStudentContext(req)
    if (!studentProfile) throw new HttpError(400, 'Complete onboarding first')
    const profileId = (studentProfile as { profile_id: number }).profile_id

    const { data: existing, error: fetchErr } = await req.supabase
      .from('career_pathways')
      .select('*')
      .eq('pathway_id', pathwayId)
      .eq('profile_id', profileId)
      .maybeSingle()

    throwIfError(fetchErr)
    if (!existing) throw new HttpError(404, 'Pathway not found')

    const currentParsed = roadmapDataSchema.safeParse(existing.roadmap_data)
    if (!currentParsed.success) throw new HttpError(500, 'Stored pathway data is invalid')

    const stepUpdates =
      body.steps ?? body.roadmapData?.steps ?? []

    let steps = currentParsed.data.steps
    if (stepUpdates.length > 0) {
      steps = mergePathwaySteps(steps, stepUpdates)
    }

    const progressSummary = computeProgressSummary(steps)
    const nextRoadmap: RoadmapData = roadmapDataSchema.parse({
      ...currentParsed.data,
      targetRole: body.roadmapData?.targetRole ?? currentParsed.data.targetRole,
      steps,
      progressSummary,
    })

    const { data: updated, error: updateErr } = await req.supabase
      .from('career_pathways')
      .update({
        roadmap_data: nextRoadmap,
        generated_at: nextRoadmap.generatedAt,
      })
      .eq('pathway_id', pathwayId)
      .eq('profile_id', profileId)
      .select('*')
      .single()

    throwIfError(updateErr)

    res.json({
      data: {
        pathwayId: updated.pathway_id,
        profileId: updated.profile_id,
        targetRoleId: updated.target_role_id,
        roadmapData: updated.roadmap_data,
        generatedAt: updated.generated_at,
      },
    })
  })
)
