import { hasExaKey, searchExa } from '../lib/exa.js'

export type AgentResourceItem = {
  title: string
  url: string
  snippet: string | null
  kind?: 'video' | 'paper' | 'course' | 'article'
}

export type AgentSourcedResourceGroup = {
  skill: string
  query: string
  items: AgentResourceItem[]
}

export type AgentSourcedResourcesMeta = {
  unavailable?: boolean
  reason?: string
}

const MAX_SKILLS = 5
const MIN_ITEMS_PER_SKILL = 2
const MAX_ITEMS_PER_SKILL = 5

const EXA_UNAVAILABLE_REASON =
  'Web search is not configured. Add EXA_API_KEY to backend/.env and restart the API.'

function inferKind(url: string, title: string): AgentResourceItem['kind'] {
  const u = url.toLowerCase()
  const t = title.toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'video'
  if (u.includes('arxiv.org') || t.includes('paper') || t.includes('journal')) return 'paper'
  if (
    t.includes('course') ||
    u.includes('coursera') ||
    u.includes('udemy') ||
    u.includes('edx.org')
  )
    return 'course'
  return 'article'
}

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

function queriesForSkill(skill: string): string[] {
  return [
    `${skill} YouTube tutorial video`,
    `${skill} research paper OR arxiv OR pdf`,
    `learn ${skill} course OR guide OR documentation`,
  ]
}

function queriesForCareer(targetRole: string): string[] {
  return [
    `${targetRole} career overview day in the job YouTube`,
    `${targetRole} industry career guide research`,
  ]
}

async function fetchItemsForQueries(queries: string[]): Promise<AgentResourceItem[]> {
  const byUrl = new Map<string, AgentResourceItem>()
  for (const query of queries) {
    if (byUrl.size >= MAX_ITEMS_PER_SKILL) break
    const results = await searchExa(query)
    for (const r of results) {
      if (!r.url || byUrl.has(r.url)) continue
      byUrl.set(r.url, {
        title: r.title,
        url: r.url,
        snippet: r.snippet || null,
        kind: inferKind(r.url, r.title),
      })
      if (byUrl.size >= MAX_ITEMS_PER_SKILL) break
    }
    if (byUrl.size >= MIN_ITEMS_PER_SKILL) continue
  }
  return [...byUrl.values()]
}

async function buildSkillGroup(skill: string): Promise<AgentSourcedResourceGroup | null> {
  const queries = queriesForSkill(skill)
  const items = await fetchItemsForQueries(queries)
  if (items.length === 0) return null
  return { skill, query: queries[0] ?? skill, items }
}

async function buildCareerGroup(targetRole: string): Promise<AgentSourcedResourceGroup | null> {
  const queries = queriesForCareer(targetRole)
  const items = await fetchItemsForQueries(queries)
  if (items.length === 0) return null
  return { skill: `${targetRole} (career overview)`, query: queries[0] ?? targetRole, items }
}

export async function fetchAgentSourcedLearningLinks(opts: {
  prioritisedPlan?: Array<{ skill?: string }>
  gaps?: string[]
  upskills?: string[]
  skills?: string[]
  targetRole?: string
}): Promise<{
  agentSourcedResources: AgentSourcedResourceGroup[]
  agentSourcedResourcesMeta?: AgentSourcedResourcesMeta
}> {
  const skillList =
    opts.skills?.length && opts.skills.some((s) => String(s).trim())
      ? opts.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, MAX_SKILLS)
      : skillNamesFromPlan(opts.prioritisedPlan, opts.gaps ?? [], opts.upskills ?? [])

  if (skillList.length === 0 && !opts.targetRole?.trim()) {
    return { agentSourcedResources: [] }
  }

  if (!hasExaKey()) {
    return {
      agentSourcedResources: [],
      agentSourcedResourcesMeta: { unavailable: true, reason: EXA_UNAVAILABLE_REASON },
    }
  }

  const agentSourcedResources: AgentSourcedResourceGroup[] = []

  if (opts.targetRole?.trim()) {
    const career = await buildCareerGroup(opts.targetRole.trim())
    if (career) agentSourcedResources.push(career)
  }

  for (const skill of skillList) {
    const group = await buildSkillGroup(skill)
    if (group) agentSourcedResources.push(group)
  }

  return { agentSourcedResources }
}
