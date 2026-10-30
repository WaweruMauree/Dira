import { FileText } from 'lucide-react'
import { diraApi } from '@/lib/api/dira'
import type { ClientToolDefinition } from '@/lib/api/types'
import { executeCvBuilder } from './cvBuilder'

export const buildCvTool = {
  name: 'buildCv',
  label: 'CV Builder (legacy)',
  icon: FileText,
  runningLabel: 'Building CV...',
  completeLabel: 'CV drafted',
}

export const buildCvDefinition: ClientToolDefinition = {
  name: 'buildCv',
  description: 'Deprecated: use cvBuilder instead.',
  parameters: {
    type: 'object',
    properties: {
      targetJobId: { type: 'number' },
      title: { type: 'string' },
      targetRole: { type: 'string' },
    },
  },
}

/** @deprecated Prefer cvBuilder; maps to the same backend flow. */
export async function executeBuildCv(input: Record<string, unknown>, token: string | null) {
  let targetRole = input.targetRole != null ? String(input.targetRole).trim() : ''
  if (!targetRole && token) {
    try {
      const { data: me } = await diraApi.me(token)
      targetRole =
        String(me.studentProfile?.career_goal ?? '').trim() ||
        String(me.student?.course ?? '').trim() ||
        'University graduate'
    } catch {
      targetRole = 'University graduate'
    }
  }
  return executeCvBuilder(
    {
      ...input,
      targetRole: targetRole || 'University graduate',
      title: input.title ?? 'CV draft',
    },
    token
  )
}
