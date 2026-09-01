import { Bookmark } from 'lucide-react'
import { diraApi } from '@/lib/api/dira'
import type { ClientToolDefinition } from '@/lib/api/types'

export const saveOpportunityTool = {
  name: 'saveOpportunity',
  label: 'Save Opportunity',
  icon: Bookmark,
  runningLabel: 'Saving opportunity...',
  completeLabel: 'Opportunity saved',
}

export const saveOpportunityDefinition: ClientToolDefinition = {
  name: 'saveOpportunity',
  description: 'Save a fetched job (userJobId) or a catalog opportunity to the student saved list.',
  parameters: {
    type: 'object',
    properties: {
      userJobId: { type: 'number' },
      opportunityId: { type: 'number' },
      title: { type: 'string' },
    },
  },
}

export async function executeSaveOpportunity(input: Record<string, unknown>, token: string | null) {
  if (!token) throw new Error('Not signed in')
  if (input.userJobId != null) {
    const data = await diraApi.patchUserJob(token, Number(input.userJobId), { saved: true })
    return { saved: true, job: data }
  }
  if (input.opportunityId != null) {
    const data = await diraApi.saveCatalogOpportunity(token, Number(input.opportunityId))
    return { saved: true, opportunity: data }
  }
  throw new Error('userJobId or opportunityId is required')
}
