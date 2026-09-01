import { Map } from 'lucide-react'
import { diraApi } from '@/lib/api/dira'
import type { ClientToolDefinition } from '@/lib/api/types'

export const mapPathwayTool = {
  name: 'mapPathway',
  label: 'Map Pathway',
  icon: Map,
  runningLabel: 'Mapping career pathway...',
  completeLabel: 'Pathway mapped',
}

export const mapPathwayDefinition: ClientToolDefinition = {
  name: 'mapPathway',
  description: 'Map a career pathway toward a target role using Dira pathway roles, skills, and edges.',
  parameters: {
    type: 'object',
    properties: { targetRole: { type: 'string' } },
    required: ['targetRole'],
  },
}

export async function executeMapPathway(input: Record<string, unknown>, token: string | null) {
  if (!token) throw new Error('Not signed in')
  const targetRole = String(input.targetRole ?? '')
  if (!targetRole) throw new Error('targetRole is required')
  const res = await diraApi.mapPathway(token, targetRole)
  return (res as { data?: unknown }).data ?? res
}
