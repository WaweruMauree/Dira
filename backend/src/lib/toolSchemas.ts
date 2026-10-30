import type { ChatCompletionTool } from 'openai/resources/chat/completions'
import { PUNCTUATION_STYLE_RULE } from './copyStyle.js'

export type ClientToolDefinition = {
  name: string
  description?: string
  parameters?: Record<string, unknown>
}

const BUILTIN: Record<string, ClientToolDefinition> = {
  webSearch: {
    name: 'webSearch',
    description:
      'Search the web for current career, job market, and education information. Use depth deep before substantive factual answers (max 2 deep + 1 quick search per turn).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        depth: { type: 'string', enum: ['quick', 'deep'], description: 'deep for research; quick for light lookups' },
      },
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
    description: 'Deprecated: use cvBuilder instead.',
    parameters: {
      type: 'object',
      properties: {
        targetJobId: { type: 'number' },
        title: { type: 'string' },
        targetRole: { type: 'string' },
      },
    },
  },
  cvBuilder: {
    name: 'cvBuilder',
    description:
      'Research role-specific CV examples on the web, then draft a complete ATS-friendly CV in markdown from the student profile only.',
    parameters: {
      type: 'object',
      properties: {
        targetRole: { type: 'string', description: 'Job or career target' },
        title: { type: 'string' },
        extraContext: { type: 'string', description: 'Optional conversation context' },
      },
      required: ['targetRole'],
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
  analyzeUploadedFile: {
    name: 'analyzeUploadedFile',
    description:
      'Summarize uploaded document text from profileContext.uploadedFiles or ask the student to attach a file.',
    parameters: {
      type: 'object',
      properties: {
        fileName: { type: 'string' },
        focus: { type: 'string' },
      },
    },
  },
  exportMarkdownDocument: {
    name: 'exportMarkdownDocument',
    description: 'Return a downloadable Markdown CV, cover letter, or study plan for the student.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        markdown: { type: 'string' },
        filename: { type: 'string' },
      },
      required: ['title', 'markdown'],
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

const STYLE_SUFFIX = ` ${PUNCTUATION_STYLE_RULE}`

export const MODE_SYSTEM: Record<string, string> = {
  general:
    `You are Dira, a career assistant for university students. Use tools when they help. Be concise and practical. Before factual career, market, or education claims, call webSearch with depth deep (one or two queries; max 2 deep and 1 quick search per turn). Cite source titles or URLs briefly in prose; never invent URLs. When asked for a CV: (1) webSearch deep for role-specific CV examples and structure, (2) call cvBuilder with targetRole, (3) reply with a short summary only — do not paste the full CV (the download card handles the file). If web search is unavailable, say so and still run cvBuilder. For pay ranges, call salaryEstimator. When the student attaches files, call analyzeUploadedFile for document text; use image content in the user message for photos. For other long deliverables (cover letter, study plan), call exportMarkdownDocument with full markdown. Do not include sandbox links, fake download URLs, or markdown file links in your reply; the app shows a download card after cvBuilder or exportMarkdownDocument. You may append a fenced block \`\`\`artifact\\n{"type":"markdown","title":"...","markdown":"...","filename":"..."}\\n\`\`\` when exportMarkdownDocument is not used.${STYLE_SUFFIX}`,
  career_guidance:
    `You are Dira Skills Analysis. Ground every answer in analyzeSkillsGap results and profileContext.skillsAnalysisSummary when present. Explain gaps and upskills with required proficiency levels. For course or YouTube recommendations, call webSearch only; never invent URLs. Prefer reputable free courses and official YouTube tutorials. One webSearch per skill, max five per turn. Use profileLookup or mapPathway when role context is unclear.${STYLE_SUFFIX}`,
  job_aggregation:
    `You are Dira Job Search. Use listJobs with queries tied to career interests and skills in profileContext. When profileContext includes cvExcerpt, use it to tailor job searches and advice. After preference changes, call listJobs again. Use webSearch, salaryEstimator, saveOpportunity as needed. Do not invent job postings.${STYLE_SUFFIX}`,
}
