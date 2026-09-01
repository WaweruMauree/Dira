import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { getStudentContext, throwIfError } from '../lib/helpers.js'

const analyzeSchema = z
  .object({
    opportunityId: z.number().int().optional(),
    targetRole: z.string().min(1).optional(),
  })
  .refine((v) => v.opportunityId || v.targetRole, {
    message: 'Provide opportunityId or targetRole',
  })

export const skillsGapRouter = Router()

skillsGapRouter.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const body = analyzeSchema.parse(req.body ?? {})
    const { studentProfile } = await getStudentContext(req)
    if (!studentProfile) {
      throw new HttpError(400, 'Complete onboarding before analyzing skills gaps')
    }
    const profileId = (studentProfile as { profile_id: number }).profile_id

    const { data: studentSkills, error: ssError } = await req.supabase
      .from('student_skills')
      .select('skill_id, proficiency_level, skills (name, category)')
      .eq('profile_id', profileId)
    throwIfError(ssError)

    const have = new Map<number, { name: string; level: number }>()
    for (const row of studentSkills ?? []) {
      const skill = row.skills as { name?: string } | null
      have.set(row.skill_id as number, {
        name: skill?.name ?? String(row.skill_id),
        level: row.proficiency_level as number,
      })
    }

    let required: { skill_id: number; name: string }[] = []
    let opportunityId = body.opportunityId ?? null

    if (body.opportunityId) {
      const { data: oppSkills, error } = await req.supabase
        .from('opportunity_skills')
        .select('skill_id, skills (name)')
        .eq('opportunity_id', body.opportunityId)
      throwIfError(error)
      required = (oppSkills ?? []).map((row) => ({
        skill_id: row.skill_id as number,
        name: (row.skills as { name?: string } | null)?.name ?? String(row.skill_id),
      }))
    } else if (body.targetRole) {
      const { data: roles, error: roleError } = await req.supabase
        .from('pathway_roles')
        .select('role_id, title')
        .ilike('title', `%${body.targetRole}%`)
        .limit(1)
      throwIfError(roleError)
      const role = roles?.[0]
      if (!role) throw new HttpError(404, `No pathway role matching "${body.targetRole}"`)
      const { data: roleSkills, error } = await req.supabase
        .from('pathway_role_skills')
        .select('skill_id, skills (name)')
        .eq('role_id', role.role_id)
      throwIfError(error)
      required = (roleSkills ?? []).map((row) => ({
        skill_id: row.skill_id as number,
        name: (row.skills as { name?: string } | null)?.name ?? String(row.skill_id),
      }))
    }

    const strengths = [...have.values()].map((s) => s.name)
    const gaps = required.filter((s) => !have.has(s.skill_id)).map((s) => s.name)
    const analysis = {
      required_skills: required,
      gaps,
      strengths,
      prioritised_plan: gaps.map((name, i) => ({
        order: i + 1,
        skill: name,
        action: `Build ${name} through a course or project before applying`,
      })),
    }

    let saved = null
    if (opportunityId) {
      const { data, error } = await req.supabase
        .from('skills_gap_analyses')
        .insert({
          profile_id: profileId,
          opportunity_id: opportunityId,
          required_skills: analysis.required_skills,
          gaps: analysis.gaps,
          prioritised_plan: analysis.prioritised_plan,
        })
        .select('*')
        .single()
      throwIfError(error)
      saved = data
    }

    res.status(201).json({ data: { ...analysis, saved } })
  })
)
