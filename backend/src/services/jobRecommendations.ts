import type { SupabaseClient } from '@supabase/supabase-js'
import type { StudentRecommendContext, UserJobInput } from '../types/jobs.js'
import { mergeRawWithFilterMeta } from '../lib/jobClassifiers.js'
import { truncateTags, truncateVarchar } from '../lib/truncate.js'
import { fetchAdzuna } from './jobProviders/adzuna.js'
import { fetchArbeitnowFiltered } from './jobProviders/arbeitnow.js'
import { fetchHimalayas } from './jobProviders/himalayas.js'
import { fetchJobicy } from './jobProviders/jobicy.js'

const ENTRY_KEYWORDS = ['intern', 'internship', 'graduate', 'entry', 'junior', 'trainee', 'assistant']

export type MatchBreakdownLine = {
  label: string
  points: number
  detail?: string
}

function jobHaystack(job: UserJobInput): string {
  return `${job.title} ${job.description ?? ''} ${(job.tags ?? []).join(' ')}`.toLowerCase()
}

export function scoreJobWithBreakdown(
  job: UserJobInput,
  ctx: StudentRecommendContext
): { score: number; breakdown: MatchBreakdownLine[] } {
  const hay = jobHaystack(job)
  const titleLower = job.title.toLowerCase()
  const breakdown: MatchBreakdownLine[] = []
  let score = 0

  for (const interest of ctx.interests) {
    const term = interest.toLowerCase().trim()
    if (term.length < 3) continue
    if (hay.includes(term)) {
      score += 12
      breakdown.push({
        label: 'Career interest in listing',
        points: 12,
        detail: interest,
      })
    }
    if (titleLower.includes(term)) {
      score += 8
      breakdown.push({
        label: 'Career interest in job title',
        points: 8,
        detail: interest,
      })
    }
  }

  for (const skill of ctx.skillNames) {
    const term = skill.toLowerCase()
    if (term.length > 2 && hay.includes(term)) {
      score += 5
      breakdown.push({
        label: 'Skill match',
        points: 5,
        detail: skill,
      })
    }
  }

  if (ctx.course) {
    const c = ctx.course.toLowerCase()
    const slice = c.slice(0, 20)
    if (hay.includes(slice)) {
      score += 4
      breakdown.push({
        label: 'Course relevance',
        points: 4,
        detail: ctx.course,
      })
    }
  }

  if (ctx.yearOfStudy != null && ctx.yearOfStudy <= 2) {
    const hit = ENTRY_KEYWORDS.find((k) => hay.includes(k))
    if (hit) {
      score += 10
      breakdown.push({
        label: 'Early-career role (year of study)',
        points: 10,
        detail: hit,
      })
    }
  }

  if (job.source === 'adzuna') {
    score += 2
    breakdown.push({
      label: 'Source bonus',
      points: 2,
      detail: 'Adzuna',
    })
  }

  return { score: Math.min(100, Math.max(0, score)), breakdown }
}

export function scoreJob(job: UserJobInput, ctx: StudentRecommendContext): number {
  return scoreJobWithBreakdown(job, ctx).score
}

function buildSearchQueries(ctx: StudentRecommendContext): string[] {
  const queries = new Set<string>()
  for (const interest of ctx.interests.slice(0, 6)) {
    if (interest.trim()) queries.add(interest.trim())
    if (ctx.course) queries.add(`${interest} ${ctx.course}`.slice(0, 80))
  }
  for (const skill of ctx.technicalSkillNames.slice(0, 3)) {
    queries.add(skill)
  }
  if (ctx.course) queries.add(ctx.course)
  if (queries.size === 0) queries.add('graduate internship')
  return [...queries].slice(0, 4)
}

const PROVIDER_TIMEOUT_MS = 12_000

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ])
  } catch {
    return null
  }
}

function dedupeKey(job: UserJobInput): string {
  return `${(job.title ?? '').toLowerCase()}|${(job.organisation ?? '').toLowerCase()}`
}

export async function fetchJobsForQuery(query: string): Promise<UserJobInput[]> {
  const attempts = [
    () => withTimeout(fetchHimalayas(query), PROVIDER_TIMEOUT_MS),
    () => withTimeout(fetchJobicy(query), PROVIDER_TIMEOUT_MS),
    () => withTimeout(fetchAdzuna(query), PROVIDER_TIMEOUT_MS),
    () => withTimeout(fetchArbeitnowFiltered(query), PROVIDER_TIMEOUT_MS),
  ]
  const settled = await Promise.allSettled(attempts.map((run) => run()))
  const collected: UserJobInput[] = []
  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      collected.push(...result.value)
    }
  }
  return collected
}

export async function recommendJobsForStudent(
  ctx: StudentRecommendContext
): Promise<UserJobInput[]> {
  const queries = buildSearchQueries(ctx)
  const merged = new Map<string, UserJobInput>()

  for (const q of queries) {
    const rows = await fetchJobsForQuery(q)
    for (const job of rows) {
      const key = dedupeKey(job)
      const { score, breakdown } = scoreJobWithBreakdown(job, ctx)
      const scored = {
        ...job,
        raw: {
          ...(job.raw ?? {}),
          relevanceScore: score,
          matchBreakdown: breakdown,
          matchedQuery: q,
        },
      }
      const existing = merged.get(key)
      if (!existing || (scored.raw?.relevanceScore as number) > (existing.raw?.relevanceScore as number)) {
        merged.set(key, scored)
      }
    }
  }

  return [...merged.values()]
    .sort((a, b) => (b.raw?.relevanceScore as number) - (a.raw?.relevanceScore as number))
    .slice(0, 30)
}

export async function loadRecommendContext(
  supabase: SupabaseClient,
  userId: string
): Promise<StudentRecommendContext | null> {
  const { data: student } = await supabase
    .from('students')
    .select('id, course')
    .eq('user_id', userId)
    .maybeSingle()
  if (!student) return null

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('profile_id, year_of_study')
    .eq('student_id', student.id)
    .maybeSingle()

  let interests: string[] = []
  let skillNames: string[] = []
  let technicalSkillNames: string[] = []

  if (studentProfile?.profile_id) {
    const { data: interestRows } = await supabase
      .from('career_interests')
      .select('area')
      .eq('profile_id', studentProfile.profile_id)
    interests = (interestRows ?? []).map((r) => String(r.area))

    const { data: skillRows } = await supabase
      .from('student_skills')
      .select('skills (name, category)')
      .eq('profile_id', studentProfile.profile_id)

    for (const row of skillRows ?? []) {
      const sk = row.skills as { name?: string; category?: string } | null
      const name = sk?.name
      if (!name) continue
      skillNames.push(name)
      if (sk?.category === 'TECH') technicalSkillNames.push(name)
    }
  }

  return {
    userId,
    course: student.course as string | null,
    yearOfStudy: (studentProfile?.year_of_study as number | null) ?? null,
    interests,
    skillNames,
    technicalSkillNames,
  }
}

export function jobsToDbRows(jobs: UserJobInput[], userId: string) {
  return jobs.map((job) => ({
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
    published_at: job.publishedAt ?? null,
    tags: truncateTags(job.tags),
    saved: job.saved ?? false,
    raw: mergeRawWithFilterMeta(job.raw, {
      title: job.title,
      description: job.description,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
    }),
    fetched_at: new Date().toISOString(),
  }))
}
