const READINESS_LABELS = {
  EXPLORING: 'exploring career options',
  PREPARING: 'preparing for the job market',
  APPLYING: 'actively applying for roles',
  READY: 'ready to start my career',
}

function skillName(row) {
  const s = row.skills
  if (!s) return ''
  if (Array.isArray(s)) return s[0]?.name ?? ''
  return s.name ?? ''
}

/**
 * @param {import('@/lib/api/types').MePayload} me
 */
export function generateAboutFromMe(me) {
  const name = me.profile?.full_name?.trim() || 'I'
  const course = me.student?.course?.trim() || 'my programme'
  const year = me.studentProfile?.year_of_study
    ? `Year ${me.studentProfile.year_of_study}`
    : 'a student'
  const readiness =
    READINESS_LABELS[me.studentProfile?.career_readiness ?? ''] ?? 'building my career path'

  const interestList = (me.interests ?? [])
    .map((row) => (typeof row === 'object' && row && 'area' in row ? String(row.area) : ''))
    .filter(Boolean)
    .slice(0, 5)

  const interestPhrase =
    interestList.length > 0
      ? `I'm especially interested in ${interestList.slice(0, 3).join(', ')}${interestList.length > 3 ? ', and more' : ''}.`
      : ''

  const ranked = [...(me.skills ?? [])]
    .map((row) => ({
      name: skillName(row),
      level: row.proficiency_level ?? 3,
    }))
    .filter((s) => s.name)
    .sort((a, b) => b.level - a.level)
    .slice(0, 5)

  const skillPhrase =
    ranked.length > 0 ? `My strongest areas include ${ranked.map((s) => s.name).join(', ')}.` : ''

  const opener =
    name === 'I'
      ? `I'm ${year} studying ${course} and I'm ${readiness}.`
      : `I'm ${name}, ${year} in ${course}, and I'm ${readiness}.`

  return [opener, interestPhrase, skillPhrase].filter(Boolean).join(' ').trim()
}

export function getDisplayName(me) {
  if (!me?.profile) return 'Student'
  return me.profile.full_name?.trim() || 'Student'
}
