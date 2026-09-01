import type { AgentChatRequest, AgentChatResponse, AgentMode, ToolCallResult } from './types'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeId() {
  return crypto.randomUUID()
}

const MOCK_JOBS = [
  { title: 'Data Analyst Intern', company: 'Safaricom', location: 'Nairobi', match: 92 },
  { title: 'Junior Software Engineer', company: 'Andela', location: 'Remote', match: 88 },
  { title: 'Product Analyst', company: 'M-KOPA', location: 'Nairobi', match: 85 },
]

function buildToolCalls(mode: AgentMode, query: string, profileContext?: Record<string, unknown>): ToolCallResult[] {
  if (mode === 'job_aggregation') {
    return [
      {
        name: 'linkedinJobSearch',
        status: 'complete',
        input: { query, location: 'Kenya' },
        output: { results: MOCK_JOBS, source: 'LinkedIn' },
      },
      {
        name: 'webSearch',
        status: 'complete',
        input: { query: `${query} internships Kenya` },
        output: { snippets: ['Ajira Digital listings', 'BrighterMonday entry roles'] },
      },
    ]
  }

  if (mode === 'career_guidance') {
    const profile = profileContext ?? {}
    return [
      {
        name: 'profileLookup',
        status: 'complete',
        input: {},
        output: {
          course: profile.course ?? 'BBIT',
          year: profile.yearOfStudy ?? 4,
          readiness: profile.careerReadiness ?? 'PREPARING',
        },
      },
      {
        name: 'mapPathway',
        status: 'complete',
        input: { targetRole: 'Data Analyst' },
        output: {
          steps: ['Complete SQL course', 'Build portfolio project', 'Apply to 5 internships'],
          estimatedMonths: 6,
        },
      },
      {
        name: 'analyzeSkillsGap',
        status: 'complete',
        input: { targetRole: 'Data Analyst' },
        output: {
          gaps: ['Python (intermediate)', 'SQL (advanced)', 'Data visualization'],
          strengths: ['Communication', 'Excel', 'Research'],
        },
      },
    ]
  }

  return [
    {
      name: 'webSearch',
      status: 'complete',
      input: { query },
      output: { snippets: ['Graduate market trends in Kenya 2026', 'Top skills for fintech roles'] },
    },
  ]
}

function buildResponseText(mode: AgentMode, query: string): string {
  if (mode === 'job_aggregation') {
    return `I found ${MOCK_JOBS.length} opportunities matching "${query}". The top match is ${MOCK_JOBS[0].title} at ${MOCK_JOBS[0].company} (${MOCK_JOBS[0].match}% fit). I searched LinkedIn and the web for the latest listings.`
  }
  if (mode === 'career_guidance') {
    return `Based on your profile, a Data Analyst path looks well aligned. I've mapped a 6-month pathway and identified 3 priority skill gaps to close before applying.`
  }
  return `Here's what I found about "${query}" from current career research sources. Let me know if you'd like to explore job matches or map a career pathway next.`
}

export async function mockAgentResponse(req: AgentChatRequest): Promise<AgentChatResponse> {
  await delay(900 + Math.random() * 600)

  const query = req.userMessage ?? ''
  const toolCalls = buildToolCalls(req.mode, query, req.profileContext)

  return {
    conversationId: req.conversationId || req.chatId || makeId(),
    status: 'complete',
    message: {
      id: makeId(),
      role: 'assistant',
      content: buildResponseText(req.mode, query),
      toolCalls,
      createdAt: new Date().toISOString(),
    },
  }
}
