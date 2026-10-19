import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { getStudentContext, throwIfError } from '../lib/helpers.js'
import { ensureSkillIds } from '../lib/skills.js'
import { createServiceClient } from '../lib/supabase.js'
import { truncateVarchar } from '../lib/truncate.js'
import { recomputeAndPersistProfileCompleteness } from '../lib/profileCompleteness.js'

const skillMap = z.record(z.string(), z.number().int().min(1).max(5))

const studentProfilePatchSchema = z
  .object({
    bio: z.string().max(5000).optional(),
    yearOfStudy: z.number().int().min(1).max(5).optional(),
    careerInterests: z.array(z.string().min(1).max(150)).min(1).optional(),
    technicalSkills: skillMap.optional(),
    softSkills: skillMap.optional(),
  })
  .refine(
    (body) =>
      body.bio !== undefined ||
      body.yearOfStudy !== undefined ||
      body.careerInterests !== undefined ||
      body.technicalSkills !== undefined ||
      body.softSkills !== undefined,
    { message: 'Provide at least one field to update' }
  )

function requireServiceClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new HttpError(
      503,
      'Skill updates require SUPABASE_SERVICE_ROLE_KEY on the API server.'
    )
  }
  return createServiceClient()
}

export const meRouter = Router()

meRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { student, studentProfile } = await getStudentContext(req)

    let skills: unknown[] = []
    let interests: unknown[] = []
    if (studentProfile) {
      const profileId = (studentProfile as { profile_id: number }).profile_id
      const { data: skillRows, error: skillError } = await req.supabase
        .from('student_skills')
        .select('id, proficiency_type, proficiency_level, created_at, skills (skill_id, name, category)')
        .eq('profile_id', profileId)
      throwIfError(skillError)
      skills = skillRows ?? []

      const { data: interestRows, error: interestError } = await req.supabase
        .from('career_interests')
        .select('*')
        .eq('profile_id', profileId)
      throwIfError(interestError)
      interests = interestRows ?? []
    }

    res.json({
      data: {
        profile: req.profile,
        student,
        studentProfile,
        skills,
        interests,
        onboarded: Boolean(studentProfile && (studentProfile as { onboarded?: boolean }).onboarded),
      },
    })
  })
)

meRouter.patch(
  '/',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        phone_number: z.string().max(20).optional(),
        username: z.string().max(255).optional(),
        full_name: z.string().max(255).optional(),
        admission_number: z.string().max(50).optional(),
        avatar_kind: z.enum(['jazzicon', 'upload']).optional(),
        jazzicon_seed: z.string().min(1).max(120).optional(),
        avatar_url: z.string().url().max(2000).nullable().optional(),
      })
      .parse(req.body ?? {})

    const patch: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) patch[key] = value
    }

    if (patch.avatar_kind === 'jazzicon') {
      patch.avatar_url = null
    }

    const { data, error } = await req.supabase
      .from('profiles')
      .update(patch)
      .eq('id', req.authUser.id)
      .select('*')
      .single()
    throwIfError(error)

    const avatarTouched =
      body.avatar_kind !== undefined ||
      body.avatar_url !== undefined ||
      body.jazzicon_seed !== undefined
    if (avatarTouched) {
      const { studentProfile } = await getStudentContext(req)
      if (studentProfile && (studentProfile as { onboarded?: boolean }).onboarded) {
        const profileId = (studentProfile as { profile_id: number }).profile_id
        await recomputeAndPersistProfileCompleteness(req.supabase, profileId, req.authUser.id)
      }
    }

    res.json({ data })
  })
)

meRouter.patch(
  '/student-profile',
  asyncHandler(async (req, res) => {
    const body = studentProfilePatchSchema.parse(req.body ?? {})

    const { student, studentProfile } = await getStudentContext(req)
    if (!student || !studentProfile) {
      throw new HttpError(403, 'Complete onboarding before editing your profile.')
    }

    const profileId = (studentProfile as { profile_id: number }).profile_id
    const profilePatch: Record<string, unknown> = {}
    if (body.bio !== undefined) profilePatch.bio = body.bio
    if (body.yearOfStudy !== undefined) profilePatch.year_of_study = body.yearOfStudy

    if (Object.keys(profilePatch).length > 0) {
      const { error } = await req.supabase
        .from('student_profiles')
        .update(profilePatch)
        .eq('profile_id', profileId)
      throwIfError(error)
    }

    const needsSkillWrite = body.technicalSkills !== undefined || body.softSkills !== undefined
    const service = needsSkillWrite ? requireServiceClient() : null

    if (body.careerInterests !== undefined) {
      const db = service ?? req.supabase
      await db.from('career_interests').delete().eq('profile_id', profileId)
      const rows = body.careerInterests.map((area) => ({
        profile_id: profileId,
        area: truncateVarchar(area, 150) ?? area.slice(0, 150),
      }))
      const { error } = await db.from('career_interests').insert(rows)
      throwIfError(error)
    }

    if (body.technicalSkills !== undefined || body.softSkills !== undefined) {
      const technical = body.technicalSkills ?? {}
      const soft = body.softSkills ?? {}
      const nameToId = await ensureSkillIds(technical, soft)

      await service!.from('student_skills').delete().eq('profile_id', profileId)

      const allNames = [...new Set([...Object.keys(technical), ...Object.keys(soft)])]
      const inserts = allNames
        .map((name) => {
          const skillId = nameToId.get(name)
          if (!skillId) return null
          return {
            profile_id: profileId,
            skill_id: skillId,
            proficiency_type: 'SELF_ASSESSED' as const,
            proficiency_level: technical[name] ?? soft[name] ?? 3,
          }
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)

      if (inserts.length > 0) {
        const { error } = await service!.from('student_skills').insert(inserts)
        throwIfError(error)
      }
    }

    await recomputeAndPersistProfileCompleteness(req.supabase, profileId, req.authUser.id)

    const { data: updatedProfile, error: loadError } = await req.supabase
      .from('student_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single()
    throwIfError(loadError)

    res.json({ data: updatedProfile })
  })
)
