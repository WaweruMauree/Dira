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

function haystack(job) {
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

export function classifyCareerStage(job) {
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

export function classifyArrangement(job) {
  const text = haystack(job)
  if (/part[\s-]?time/.test(text)) return 'part_time'
  if (/full[\s-]?time/.test(text)) return 'full_time'
  if (/freelance|contractor|contract\b|consulting/.test(text)) return 'contract'
  return 'unknown'
}

export function classifyJob(job) {
  return {
    careerStage: classifyCareerStage(job),
    arrangement: classifyArrangement(job),
  }
}

export const REMOTE_LOCATION_RE = /remote|wfh|work from home|anywhere/i

export function isRemoteLocationString(loc) {
  return REMOTE_LOCATION_RE.test(String(loc ?? ''))
}
