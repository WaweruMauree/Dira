import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, HttpError } from '../middleware/error.js'
import { getStudentContext, throwIfError } from '../lib/helpers.js'

const skillMap = z.record(z.string(), z.number().int().min(1).max(5))

const onboardingSchema = z.object({
  course: z.string().min(1),
  yearOfStudy: z.number().int().min(1).max(5),
  technicalSkills: skillMap,
  softSkills: skillMap,
  careerInterests: z.array(z.string().min(1)).min(1),
  careerReadiness: z.enum(['EXPLORING', 'PREPARING', 'APPLYING', 'READY']),
  bio: z.string().optional(),
  careerGoal: z.string().optional(),
})

export const onboardingRouter = Router()

onboardingRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = onboardingSchema.parse(req.body)
    const { student } = await getStudentContext(req)
    if (!student) {
      throw new HttpError(403, 'Only students can complete onboarding')
    }

    const { error: courseError } = await req.supabase
      .from('students')
      .update({ course: body.course })
      .eq('id', student.id)
    throwIfError(courseError)

    const completeness = Math.min(
      100,
      40 +
        Math.min(30, Object.keys(body.technicalSkills).length * 5) +
        Math.min(15, Object.keys(body.softSkills).length * 5) +
        Math.min(15, body.careerInterests.length * 5)
    )

    const profilePayload = {
      student_id: student.id,
      year_of_study: body.yearOfStudy,
      career_readiness: body.careerReadiness,
      bio: body.bio ?? null,
      career_goal: body.careerGoal ?? null,
      profile_completeness: completeness,
      onboarded: true,
    }

    const { data: existing } = await req.supabase
      .from('student_profiles')
      .select('profile_id')
      .eq('student_id', student.id)
      .maybeSingle()

    let profileId: number
    if (existing?.profile_id) {
      const { data, error } = await req.supabase
        .from('student_profiles')
        .update(profilePayload)
        .eq('profile_id', existing.profile_id)
        .select('profile_id')
        .single()
      throwIfError(error)
      if (!data) throw new HttpError(500, 'Failed to update student profile')
      profileId = data.profile_id as number
    } else {
      const { data, error } = await req.supabase
        .from('student_profiles')
        .insert(profilePayload)
        .select('profile_id')
        .single()
      throwIfError(error)
      if (!data) throw new HttpError(500, 'Failed to create student profile')
      profileId = data.profile_id as number
    }

    const skillNames = [...Object.keys(body.technicalSkills), ...Object.keys(body.softSkills)]
    const uniqueNames = [...new Set(skillNames)]
    const { data: skillRows, error: skillsError } = await req.supabase
      .from('skills')
      .select('skill_id, name')
      .in('name', uniqueNames)
    throwIfError(skillsError)

    const nameToId = new Map((skillRows ?? []).map((s) => [s.name as string, s.skill_id as number]))

    await req.supabase.from('student_skills').delete().eq('profile_id', profileId)
    await req.supabase.from('career_interests').delete().eq('profile_id', profileId)

    const skillInserts = uniqueNames
      .map((name) => {
        const skillId = nameToId.get(name)
        if (!skillId) return null
        const level = body.technicalSkills[name] ?? body.softSkills[name] ?? 3
        return {
          profile_id: profileId,
          skill_id: skillId,
          proficiency_type: 'SELF_ASSESSED' as const,
          proficiency_level: level,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    if (skillInserts.length > 0) {
      const { error } = await req.supabase.from('student_skills').insert(skillInserts)
      throwIfError(error)
    }

    const interestInserts = body.careerInterests.map((area) => ({
      profile_id: profileId,
      area,
    }))
    const { error: interestError } = await req.supabase.from('career_interests').insert(interestInserts)
    throwIfError(interestError)

    const { data: studentProfile, error: loadError } = await req.supabase
      .from('student_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single()
    throwIfError(loadError)

    res.status(201).json({
      data: {
        student: { ...student, course: body.course },
        studentProfile,
        onboarded: true,
      },
    })
  })
)
