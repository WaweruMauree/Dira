import { hasExaKey, searchExa } from '../lib/exa.js'

export type AgentSourcedResourceGroup = {
  skill: string
  query: string
  items: Array<{ title: string; url: string; snippet: string | null }>
}

export type AgentSourcedResourcesMeta = {
  unavailable?: boolean
  reason?: string
}

const MAX_SKILLS = 5
const RESULTS_PER_SKILL = 4

const EXA_UNAVAILABLE_REASON =
  'Web search is not configured. Add EXA_API_KEY to backend/.env and restart the API.'

function skillNamesFromPlan(
  prioritisedPlan: Array<{ skill?: string }> | undefined,
  gaps: string[],
  upskills: string[]
): string[] {
  const ordered: string[] = []
  const seen = new Set<string>()
  for (const step of prioritisedPlan ?? []) {
    const name = String(step.skill ?? '').trim()
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    ordered.push(name)
  }
  for (const name of [...gaps, ...upskills]) {
    const trimmed = String(name).trim()
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue
    seen.add(trimmed.toLowerCase())
    ordered.push(trimmed)
  }
  return ordered.slice(0, MAX_SKILLS)
}

function buildQuery(skill: string): string {
  return `free YouTube tutorial ${skill} OR free online course ${skill}`
}

export async function fetchAgentSourcedLearningLinks(opts: {
  prioritisedPlan?: Array<{ skill?: string }>
  gaps?: string[]
  upskills?: string[]
  skills?: string[]
}): Promise<{
  agentSourcedResources: AgentSourcedResourceGroup[]
  agentSourcedResourcesMeta?: AgentSourcedResourcesMeta
}> {
  const skillList =
    opts.skills?.length && opts.skills.some((s) => String(s).trim())
      ? opts.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, MAX_SKILLS)
      : skillNamesFromPlan(opts.prioritisedPlan, opts.gaps ?? [], opts.upskills ?? [])

  if (skillList.length === 0) {
    return { agentSourcedResources: [] }
  }

  if (!hasExaKey()) {
    return {
      agentSourcedResources: [],
      agentSourcedResourcesMeta: { unavailable: true, reason: EXA_UNAVAILABLE_REASON },
    }
  }

  const agentSourcedResources: AgentSourcedResourceGroup[] = []

  for (const skill of skillList) {
    const query = buildQuery(skill)
    const results = await searchExa(query)
    const items = results
      .filter((r) => r.url)
      .slice(0, RESULTS_PER_SKILL)
      .map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet || null,
      }))
    if (items.length > 0) {
      agentSourcedResources.push({ skill, query, items })
    }
  }

  return { agentSourcedResources }
}
