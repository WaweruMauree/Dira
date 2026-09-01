import { Globe } from 'lucide-react'
import { searchExa } from '../providers/exa'
import type { ClientToolDefinition } from '@/lib/api/types'

export const webSearchTool = {
  name: 'webSearch',
  label: 'Web Search',
  icon: Globe,
  runningLabel: 'Searching the web...',
  completeLabel: 'Web search complete',
}

export const webSearchDefinition: ClientToolDefinition = {
  name: 'webSearch',
  description: 'Search the web for current career, job market, and education information using Exa.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
    },
    required: ['query'],
  },
}

export async function executeWebSearch(input: Record<string, unknown>) {
  const query = String(input.query ?? '')
  if (!query) return { error: 'query is required' }
  try {
    const results = await searchExa(query)
    return { query, results }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Exa search failed' }
  }
}
