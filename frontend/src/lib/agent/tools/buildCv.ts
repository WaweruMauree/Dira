import { FileText } from 'lucide-react'
import { diraApi } from '@/lib/api/dira'
import type { ClientToolDefinition } from '@/lib/api/types'

export const buildCvTool = {
  name: 'buildCv',
  label: 'CV Builder',
  icon: FileText,
  runningLabel: 'Building CV...',
  completeLabel: 'CV drafted',
}

export const buildCvDefinition: ClientToolDefinition = {
  name: 'buildCv',
  description: 'Build a JSON Resume draft from the student profile, optionally tailored to a fetched job.',
  parameters: {
    type: 'object',
    properties: {
      targetJobId: { type: 'number' },
      title: { type: 'string' },
    },
  },
}

function skillName(row: unknown): string {
  if (!row || typeof row !== 'object') return ''
  const rec = row as { skills?: { name?: string }; name?: string }
  return rec.skills?.name ?? rec.name ?? ''
}

export async function executeBuildCv(input: Record<string, unknown>, token: string | null) {
  if (!token) throw new Error('Not signed in')
  const { data: me } = await diraApi.me(token)
  const skillNames = me.skills.map(skillName).filter(Boolean)
  const interests = (me.interests as Array<{ area?: string }>).map((i) => i.area).filter(Boolean)

  const resume = {
    basics: {
      name: me.profile.full_name || me.profile.username || 'Student',
      label: me.studentProfile?.career_goal || me.student?.course || 'University student',
      summary: `Student in ${me.student?.course ?? 'university'} (year ${me.studentProfile?.year_of_study ?? 'n/a'}), career readiness ${me.studentProfile?.career_readiness ?? 'unknown'}. Interests: ${interests.join(', ') || 'not specified'}.`,
    },
    education: [
      {
        institution: 'University',
        area: me.student?.course ?? '',
        studyType: 'Bachelor',
      },
    ],
    skills: skillNames.map((name) => ({ name, level: 'intermediate', keywords: [name] })),
    interests: interests.map((name) => ({ name })),
  }

  const saved = await diraApi.createCv(token, {
    title: String(input.title ?? 'Dira Resume'),
    targetJobId: input.targetJobId != null ? Number(input.targetJobId) : undefined,
    resume,
  })

  return { resume, saved: saved.data }
}
