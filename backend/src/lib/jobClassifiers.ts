export type CareerStage = 'early' | 'experienced' | 'unknown'
export type EmploymentArrangement = 'full_time' | 'part_time' | 'contract' | 'unknown'

const EARLY_KEYWORDS = [
  'intern',
  'internship',
  'entry-level',
  'entry level',
  'graduate trainee',
  'graduate program',
  'graduate programme',
  'apprenticeship',
  'apprentice',
  'junior',
  'trainee',
  'new grad',
  'early career',
]

const EXPERIENCED_KEYWORDS = [
  'mid-level',
  'mid level',
  'senior',
  'lead',
  'principal',
  'staff',
  'executive',
  'director',
  'head of',
  'vp ',
  'vice president',
  'manager',
]

function haystack(job: {
  title?: string | null
  description?: string | null
  employment_type?: string | null
  employmentType?: string | null
  experience_level?: number | null
  experienceLevel?: number | null
}): string {
  const exp = job.experience_level ?? job.experienceLevel
  return [
    job.title,
    job.description,
    job.employment_type ?? job.employmentType,
    exp != null ? String(exp) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function classifyCareerStage(job: Parameters<typeof haystack>[0]): CareerStage {
  const text = haystack(job)
  const exp = job.experience_level ?? job.experienceLevel
  if (exp != null && exp <= 2 && /intern|entry|junior|graduate|trainee|apprentice/.test(text)) {
    return 'early'
  }
  if (EARLY_KEYWORDS.some((k) => text.includes(k))) return 'early'
  if (EXPERIENCED_KEYWORDS.some((k) => text.includes(k))) return 'experienced'
  if (exp != null && exp >= 4) return 'experienced'
  if (exp != null && exp <= 2) return 'early'
  return 'unknown'
}

export function classifyArrangement(job: Parameters<typeof haystack>[0]): EmploymentArrangement {
  const text = haystack(job)
  if (/part[\s-]?time/.test(text)) return 'part_time'
  if (/full[\s-]?time/.test(text)) return 'full_time'
  if (/freelance|contractor|contract\b|consulting/.test(text)) return 'contract'
  return 'unknown'
}

export function buildFilterMeta(job: Parameters<typeof haystack>[0]) {
  return {
    careerStage: classifyCareerStage(job),
    arrangement: classifyArrangement(job),
  }
}

export function mergeRawWithFilterMeta(
  raw: Record<string, unknown> | undefined,
  job: Parameters<typeof haystack>[0]
): Record<string, unknown> {
  return {
    ...(raw ?? {}),
    filterMeta: buildFilterMeta(job),
  }
}
