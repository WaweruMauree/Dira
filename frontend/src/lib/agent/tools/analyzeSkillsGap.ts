import { Target } from 'lucide-react'
import { diraApi } from '@/lib/api/dira'
import type { ClientToolDefinition } from '@/lib/api/types'

export const analyzeSkillsGapTool = {
  name: 'analyzeSkillsGap',
  label: 'Analyze Skills Gap',
  icon: Target,
  runningLabel: 'Analyzing skills gap...',
  completeLabel: 'Skills gap analyzed',
}

export const analyzeSkillsGapDefinition: ClientToolDefinition = {
  name: 'analyzeSkillsGap',
  description:
    'Compare the student profile against industry skills for one career interest (targetRole). Returns met, upskill, and gap skills with proficiency levels and methodology.',
  parameters: {
    type: 'object',
    properties: {
      targetRole: { type: 'string', description: 'One career interest from onboarding' },
      opportunityId: { type: 'number' },
    },
  },
}

export async function executeAnalyzeSkillsGap(input: Record<string, unknown>, token: string | null) {
  if (!token) throw new Error('Not signed in')
  const res = await diraApi.analyzeSkillsGap(token, {
    targetRole: input.targetRole ? String(input.targetRole) : undefined,
    opportunityId: input.opportunityId != null ? Number(input.opportunityId) : undefined,
  })
  return (res as { data?: unknown }).data ?? res
}
