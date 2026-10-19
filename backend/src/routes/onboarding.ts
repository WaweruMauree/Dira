import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { asyncHandler, HttpError, supabaseError } from '../middleware/error.js'
import { getStudentContext } from '../lib/helpers.js'
import { ensureSkillIds } from '../lib/skills.js'
import { createServiceClient } from '../lib/supabase.js'
import { generateAbout } from '../lib/generateAbout.js'
import { getProgrammeOnboardingSuggestions } from '../services/programmeOnboardingSuggestions.js'
import { computeProfileCompleteness } from '../lib/profileCompleteness.js'

const programmeSuggestionsSchema = z.object({
  courseCatalogId: z.string().max(64),
  programmeLabel: z.string().min(2).max(200),
})

function isMissingColumnError(
  error: { message?: string; code?: string } | null,
  columnName: string
): boolean {
  if (!error?.message) return false
  const msg = error.message.toLowerCase()
  const col = columnName.toLowerCase()
  return msg.includes(col) || (msg.includes('schema cache') && msg.includes(col))
}

const skillMap = z.record(z.string(), z.number().int().min(1).max(5))

const onboardingSchema = z.object({
  course: z.string().min(1).max(150),
  courseCatalogId: z.string().optional(),
  otherProgramme: z.string().max(150).optional(),
  yearOfStudy: z.number().int().min(1).max(5),
  technicalSkills: skillMap,
  softSkills: skillMap,
  careerInterests: z.array(z.string().min(1).max(150)).min(1),
  careerReadiness: z.enum(['EXPLORING', 'PREPARING', 'APPLYING', 'READY']),
  bio: z.string().optional(),
  careerGoal: z.string().optional(),
  careerSearchFeedback: z.string().max(4000).optional(),
})

function requireOnboardingServiceClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new HttpError(
      503,
      'Onboarding is unavailable: set SUPABASE_SERVICE_ROLE_KEY in backend/.env (Supabase Dashboard → Settings → API).'
    )
  }
  return createServiceClient()
}

function throwOnboardingDbError(
  error: { message: string; code?: string; details?: string } | null,
  step: string
) {
  if (!error) return
  const mapped = supabaseError(error)
  if (mapped.status === 403) {
    throw new HttpError(
      403,
      `Could not save onboarding (${step}). ${mapped.message}`,
      mapped.code,
      mapped.details
    )
  }
  throw mapped
}

export const onboardingRouter = Router()

onboardingRouter.post(
  '/programme-suggestions',
  asyncHandler(async (req, res) => {
    const body = programmeSuggestionsSchema.parse(req.body)
    const data = await getProgrammeOnboardingSuggestions({
      courseCatalogId: body.courseCatalogId || 'OTHER',
      programmeLabel: body.programmeLabel.trim(),
    })
    res.json({ data })
  })
)

onboardingRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = onboardingSchema.parse(req.body)
    const { student } = await getStudentContext(req)

    if (!student) {
      throw new HttpError(
        403,
        'Student record missing. Sign out and sign up again, or contact support.'
      )
    }

    const studentUserId = student.user_id as string
    if (studentUserId !== req.authUser.id) {
      throw new HttpError(403, 'You can only complete onboarding for your own account.')
    }

    const service = requireOnboardingServiceClient()

    const [, nameToId] = await Promise.all([
      (async () => {
        const courseRes = await service.from('students').update({ course: body.course }).eq('id', student.id)
        throwOnboardingDbError(courseRes.error, 'course')

        const profileRes = await service
          .from('profiles')
          .update({ jazzicon_seed: req.authUser.id })
          .eq('id', req.authUser.id)
        if (profileRes.error) {
          if (isMissingColumnError(profileRes.error, 'jazzicon_seed')) {
            console.warn(
              '[onboarding] profiles.jazzicon_seed missing — run migration 005_profile_avatar.sql'
            )
          } else {
            throwOnboardingDbError(profileRes.error, 'profile avatar seed')
          }
        }
      })(),
      ensureSkillIds(body.technicalSkills, body.softSkills),
    ])

    const generatedBio =
      body.bio ??
      generateAbout({
        fullName: req.profile?.full_name ?? null,
        course: body.course,
        yearOfStudy: body.yearOfStudy,
        careerReadiness: body.careerReadiness,
        interests: body.careerInterests,
        skills: [
          ...Object.entries(body.technicalSkills).map(([name, level]) => ({
            proficiency_level: level,
            skills: { name, category: 'TECH' },
          })),
          ...Object.entries(body.softSkills).map(([name, level]) => ({
            proficiency_level: level,
            skills: { name, category: 'SOFT' },
          })),
        ],
      })

    const completeness = computeProfileCompleteness({
      course: body.course,
      yearOfStudy: body.yearOfStudy,
      careerReadiness: body.careerReadiness,
      careerInterestCount: body.careerInterests.length,
      technicalSkillCount: Object.keys(body.technicalSkills).length,
      softSkillCount: Object.keys(body.softSkills).length,
      bio: generatedBio,
      avatarKind: 'jazzicon',
    })

    const feedbackTrimmed = body.careerSearchFeedback?.trim()
    const profilePayload = {
      student_id: student.id,
      year_of_study: body.yearOfStudy,
      career_readiness: body.careerReadiness,
      bio: generatedBio,
      career_goal: body.careerGoal ?? null,
      career_search_feedback: feedbackTrimmed ? feedbackTrimmed : null,
      profile_completeness: completeness,
      onboarded: true,
    }

    const { data: existing, error: existingError } = await service
      .from('student_profiles')
      .select('profile_id')
      .eq('student_id', student.id)
      .maybeSingle()
    throwOnboardingDbError(existingError, 'profile lookup')

    async function saveStudentProfile(payload: typeof profilePayload) {
      if (existing?.profile_id) {
        return service
          .from('student_profiles')
          .update(payload)
          .eq('profile_id', existing.profile_id)
          .select('profile_id')
          .single()
      }
      return service.from('student_profiles').insert(payload).select('profile_id').single()
    }

    let profileId: number
    let { data: savedProfile, error: saveError } = await saveStudentProfile(profilePayload)
    if (
      saveError &&
      isMissingColumnError(saveError, 'career_search_feedback') &&
      'career_search_feedback' in profilePayload
    ) {
      console.warn(
        '[onboarding] student_profiles.career_search_feedback missing — run migration 009_career_search_feedback.sql'
      )
      const { career_search_feedback: _omit, ...withoutFeedback } = profilePayload
      ;({ data: savedProfile, error: saveError } = await saveStudentProfile(withoutFeedback as typeof profilePayload))
    }
    throwOnboardingDbError(saveError, existing?.profile_id ? 'profile update' : 'profile create')
    if (!savedProfile) throw new HttpError(500, 'Failed to save student profile')
    profileId = savedProfile.profile_id as number

    const allSkillNames = [
      ...Object.keys(body.technicalSkills),
      ...Object.keys(body.softSkills),
    ]
    const uniqueNames = [...new Set(allSkillNames)]

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

    const interestInserts = body.careerInterests.map((area) => ({
      profile_id: profileId,
      area: area.slice(0, 150),
    }))

    const [deleteSkillsRes, deleteInterestsRes] = await Promise.all([
      service.from('student_skills').delete().eq('profile_id', profileId),
      service.from('career_interests').delete().eq('profile_id', profileId),
    ])
    throwOnboardingDbError(deleteSkillsRes.error, 'skills reset')
    throwOnboardingDbError(deleteInterestsRes.error, 'interests reset')

    await Promise.all([
      skillInserts.length > 0
        ? service.from('student_skills').insert(skillInserts).then(({ error }) => {
            throwOnboardingDbError(error, 'skills')
          })
        : Promise.resolve(),
      service.from('career_interests').insert(interestInserts).then(({ error }) => {
        throwOnboardingDbError(error, 'career interests')
      }),
    ])

    const studentProfile = {
      profile_id: profileId,
      ...profilePayload,
    }

    res.status(201).json({
      data: {
        student: { ...student, course: body.course },
        studentProfile,
        onboarded: true,
      },
    })
  })
)
