type SkillRow = {
  proficiency_level?: number
  skills?: { name?: string; category?: string } | { name?: string; category?: string }[]
}

type GenerateAboutInput = {
  fullName?: string | null
  course?: string | null
  yearOfStudy?: number | null
  careerReadiness?: string | null
  interests?: string[]
  skills?: SkillRow[]
}

const READINESS_LABELS: Record<string, string> = {
  EXPLORING: 'exploring career options',
  PREPARING: 'preparing for the job market',
  APPLYING: 'actively applying for roles',
  READY: 'ready to start my career',
}

function skillName(row: SkillRow): string {
  const s = row.skills
  if (!s) return ''
  if (Array.isArray(s)) return s[0]?.name ?? ''
  return s.name ?? ''
}

export function generateAbout(input: GenerateAboutInput): string {
  const name = input.fullName?.trim() || 'I'
  const course = input.course?.trim() || 'my programme'
  const year = input.yearOfStudy ? `Year ${input.yearOfStudy}` : 'a student'
  const readiness =
    READINESS_LABELS[input.careerReadiness ?? ''] ?? 'building my career path'

  const interestList = (input.interests ?? []).filter(Boolean).slice(0, 5)
  const interestPhrase =
    interestList.length > 0
      ? `I'm especially interested in ${interestList.slice(0, 3).join(', ')}${interestList.length > 3 ? ', and more' : ''}.`
      : ''

  const ranked = [...(input.skills ?? [])]
    .map((row) => ({ name: skillName(row), level: row.proficiency_level ?? 3 }))
    .filter((s) => s.name)
    .sort((a, b) => b.level - a.level)
    .slice(0, 5)
  const skillPhrase =
    ranked.length > 0
      ? `My strongest areas include ${ranked.map((s) => s.name).join(', ')}.`
      : ''

  const opener =
    name === 'I'
      ? `I'm ${year} studying ${course} and I'm ${readiness}.`
      : `I'm ${name}, ${year} in ${course}, and I'm ${readiness}.`

  return [opener, interestPhrase, skillPhrase].filter(Boolean).join(' ').trim()
}
