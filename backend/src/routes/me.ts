import { Router } from 'express'
import { asyncHandler } from '../middleware/error.js'
import { getStudentContext, throwIfError } from '../lib/helpers.js'

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
    const allowed = ['phone_number', 'username', 'full_name', 'admission_number'] as const
    const patch: Record<string, unknown> = {}
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) patch[key] = req.body[key]
    }
    const { data, error } = await req.supabase
      .from('profiles')
      .update(patch)
      .eq('id', req.authUser.id)
      .select('*')
      .single()
    throwIfError(error)
    res.json({ data })
  })
)
