import type { SupabaseClient } from '@supabase/supabase-js'
import { throwIfError } from './helpers.js'

/**
 * Profile completeness rubric (sums to 100).
 *
 * | Criterion          | Points | Rule                                      |
 * |--------------------|--------|-------------------------------------------|
 * | Course             | 15     | students.course non-empty                 |
 * | Year of study      | 10     | year_of_study 1–5                         |
 * | Career readiness   | 10     | career_readiness enum set                 |
 * | Career interests   | 15     | ≥1 interest → full bucket (count ignored) |
 * | Technical skills   | 15     | ≥1 TECH skill → full bucket               |
 * | Soft skills        | 15     | ≥1 SOFT skill → full bucket               |
 * | Bio                | 10     | trimmed bio non-empty                     |
 * | Avatar             | 10     | avatar_kind jazzicon or upload            |
 */
export const PROFILE_COMPLETENESS_WEIGHTS = {
  course: 15,
  yearOfStudy: 10,
  careerReadiness: 10,
  careerInterests: 15,
  technicalSkills: 15,
  softSkills: 15,
  bio: 10,
  avatar: 10,
} as const

export type ProfileCompletenessInput = {
  course?: string | null
  yearOfStudy?: number | null
  careerReadiness?: string | null
  careerInterestCount: number
  technicalSkillCount: number
  softSkillCount: number
  bio?: string | null
  avatarKind?: string | null
}

export function computeProfileCompleteness(input: ProfileCompletenessInput): number {
  let score = 0
  const w = PROFILE_COMPLETENESS_WEIGHTS

  if (input.course?.trim()) score += w.course
  if (
    typeof input.yearOfStudy === 'number' &&
    input.yearOfStudy >= 1 &&
    input.yearOfStudy <= 5
  ) {
    score += w.yearOfStudy
  }
  if (input.careerReadiness?.trim()) score += w.careerReadiness
  if (input.careerInterestCount >= 1) score += w.careerInterests
  if (input.technicalSkillCount >= 1) score += w.technicalSkills
  if (input.softSkillCount >= 1) score += w.softSkills
  if (input.bio?.trim()) score += w.bio
  if (input.avatarKind === 'jazzicon' || input.avatarKind === 'upload') score += w.avatar

  return Math.min(100, Math.max(0, score))
}

export type ProfileCompletenessContext = ProfileCompletenessInput

export async function fetchProfileCompletenessContext(
  supabase: SupabaseClient,
  profileId: number,
  userId: string
): Promise<ProfileCompletenessContext> {
  const { data: studentProfile, error: spErr } = await supabase
    .from('student_profiles')
    .select('year_of_study, career_readiness, bio, student_id')
    .eq('profile_id', profileId)
    .single()
  throwIfError(spErr)

  let course: string | null = null
  if (studentProfile?.student_id) {
    const { data: studentRow, error: stErr } = await supabase
      .from('students')
      .select('course')
      .eq('id', studentProfile.student_id)
      .maybeSingle()
    throwIfError(stErr)
    course = (studentRow?.course as string | null) ?? null
  }

  const { data: profileRow, error: prErr } = await supabase
    .from('profiles')
    .select('avatar_kind')
    .eq('id', userId)
    .maybeSingle()
  throwIfError(prErr)

  const { count: interestCount, error: intErr } = await supabase
    .from('career_interests')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
  throwIfError(intErr)

  const { data: skillRows, error: skErr } = await supabase
    .from('student_skills')
    .select('skills (category)')
    .eq('profile_id', profileId)
  throwIfError(skErr)

  let technicalSkillCount = 0
  let softSkillCount = 0
  for (const row of skillRows ?? []) {
    const cat = (row as { skills?: { category?: string } | null }).skills?.category
    if (cat === 'TECH') technicalSkillCount += 1
    else softSkillCount += 1
  }

  return {
    course,
    yearOfStudy: (studentProfile?.year_of_study as number | null) ?? null,
    careerReadiness: (studentProfile?.career_readiness as string | null) ?? null,
    careerInterestCount: interestCount ?? 0,
    technicalSkillCount,
    softSkillCount,
    bio: (studentProfile?.bio as string | null) ?? null,
    avatarKind: (profileRow?.avatar_kind as string | null) ?? null,
  }
}

export async function recomputeAndPersistProfileCompleteness(
  supabase: SupabaseClient,
  profileId: number,
  userId: string
): Promise<number> {
  const ctx = await fetchProfileCompletenessContext(supabase, profileId, userId)
  const completeness = computeProfileCompleteness(ctx)
  const { error } = await supabase
    .from('student_profiles')
    .update({ profile_completeness: completeness })
    .eq('profile_id', profileId)
  throwIfError(error)
  return completeness
}
