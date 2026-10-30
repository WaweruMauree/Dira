import { FileText } from 'lucide-react'
import { diraApi } from '@/lib/api/dira'
import type { ClientToolDefinition } from '@/lib/api/types'

export const cvBuilderTool = {
  name: 'cvBuilder',
  label: 'CV Builder',
  icon: FileText,
  runningLabel: 'Researching CV examples and drafting…',
  completeLabel: 'CV drafted',
}

export const cvBuilderDefinition: ClientToolDefinition = {
  name: 'cvBuilder',
  description:
    'Research role-specific CV examples on the web, then draft a complete ATS-friendly CV in markdown from the student profile.',
  parameters: {
    type: 'object',
    properties: {
      targetRole: { type: 'string', description: 'Job or career target to tailor the CV' },
      title: { type: 'string', description: 'Document title shown in the app' },
      extraContext: { type: 'string', description: 'Optional notes from the conversation' },
    },
    required: ['targetRole'],
  },
}

export async function executeCvBuilder(input: Record<string, unknown>, token: string | null) {
  if (!token) throw new Error('Not signed in')
  const targetRole = String(input.targetRole ?? '').trim()
  if (!targetRole) return { error: 'targetRole is required' }

  try {
    const { data } = await diraApi.cvBuilder(token, {
      targetRole,
      title: input.title != null ? String(input.title) : undefined,
      extraContext: input.extraContext != null ? String(input.extraContext) : undefined,
    })
    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CV builder failed'
    return { error: message }
  }
}
