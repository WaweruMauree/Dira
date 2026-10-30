import { Globe } from 'lucide-react'
import { diraApi } from '@/lib/api/dira'
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
  description:
    'Search the web for current career, job market, and education information. Use depth "deep" before substantive factual answers.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      depth: {
        type: 'string',
        enum: ['quick', 'deep'],
        description: 'quick for light lookups; deep (default for research) for richer excerpts',
      },
    },
    required: ['query'],
  },
}

export async function executeWebSearch(input: Record<string, unknown>, token: string | null) {
  const query = String(input.query ?? '')
  if (!query) return { error: 'query is required' }
  if (!token) return { error: 'Not signed in' }

  const depthRaw = input.depth != null ? String(input.depth) : 'quick'
  const depth = depthRaw === 'deep' ? 'deep' : 'quick'

  try {
    const { data } = await diraApi.webSearch(token, { query, depth })
    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Web search failed'
    return { error: message, query, depth }
  }
}
