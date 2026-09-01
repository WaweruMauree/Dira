import type { ChatCompletionTool } from 'openai/resources/chat/completions'

export type ClientToolDefinition = {
  name: string
  description?: string
  parameters?: Record<string, unknown>
}

const BUILTIN: Record<string, ClientToolDefinition> = {
  webSearch: {
    name: 'webSearch',
    description: 'Search the web for current career, job market, and education information.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query' } },
      required: ['query'],
    },
  },
  listJobs: {
    name: 'listJobs',
    description: 'Search remote and entry-level job listings from Jobicy and Himalayas.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        location: { type: 'string' },
        employmentType: { type: 'string' },
      },
      required: ['query'],
    },
  },
  saveOpportunity: {
    name: 'saveOpportunity',
    description: 'Save a previously fetched job to the student saved list.',
    parameters: {
      type: 'object',
      properties: {
        userJobId: { type: 'number' },
        title: { type: 'string' },
      },
      required: ['userJobId'],
    },
  },
  mapPathway: {
    name: 'mapPathway',
    description: 'Map a career pathway toward a target role using Dira pathway data.',
    parameters: {
      type: 'object',
      properties: { targetRole: { type: 'string' } },
      required: ['targetRole'],
    },
  },
  analyzeSkillsGap: {
    name: 'analyzeSkillsGap',
    description: 'Compare the student profile against a target role or opportunity and list skill gaps.',
    parameters: {
      type: 'object',
      properties: {
        targetRole: { type: 'string' },
        opportunityId: { type: 'number' },
      },
    },
  },
  profileLookup: {
    name: 'profileLookup',
    description: 'Load the current student profile, skills, and career interests.',
    parameters: { type: 'object', properties: {} },
  },
  buildCv: {
    name: 'buildCv',
    description: 'Build a JSON Resume draft from the student profile, optionally tailored to a fetched job.',
    parameters: {
      type: 'object',
      properties: {
        targetJobId: { type: 'number' },
        title: { type: 'string' },
      },
    },
  },
  salaryEstimator: {
    name: 'salaryEstimator',
    description: 'Estimate salary range for a role from public job listings.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        location: { type: 'string' },
      },
      required: ['query'],
    },
  },
  linkedinJobSearch: {
    name: 'linkedinJobSearch',
    description: 'Deprecated alias for listJobs. Search job listings.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        location: { type: 'string' },
      },
      required: ['query'],
    },
  },
}

export function resolveTools(input: unknown): ChatCompletionTool[] {
  if (!Array.isArray(input) || input.length === 0) return []

  return input
    .map((item): ChatCompletionTool | null => {
      if (typeof item === 'string') {
        const def = BUILTIN[item]
        if (!def) return null
        return {
          type: 'function',
          function: {
            name: def.name,
            description: def.description,
            parameters: def.parameters ?? { type: 'object', properties: {} },
          },
        }
      }
      if (item && typeof item === 'object' && 'name' in item && typeof (item as { name: unknown }).name === 'string') {
        const def = item as ClientToolDefinition
        const fallback = BUILTIN[def.name]
        return {
          type: 'function',
          function: {
            name: def.name,
            description: def.description ?? fallback?.description ?? def.name,
            parameters: def.parameters ?? fallback?.parameters ?? { type: 'object', properties: {} },
          },
        }
      }
      return null
    })
    .filter((t): t is ChatCompletionTool => t !== null)
}

export const MODE_SYSTEM: Record<string, string> = {
  general:
    'You are Dira, a career assistant for university students. Use tools when they help. Be concise and practical. When you need live web facts, call webSearch. When asked for a CV, call buildCv. For pay ranges, call salaryEstimator.',
  career_guidance:
    'You are Dira Career Guidance. Use profileLookup, mapPathway, analyzeSkillsGap, buildCv, and salaryEstimator as needed. Ground advice in the student profile.',
  job_aggregation:
    'You are Dira Job Search. Use listJobs to find roles, webSearch for market context, salaryEstimator for pay, and saveOpportunity when the student wants to keep a listing. Do not invent job postings.',
}
