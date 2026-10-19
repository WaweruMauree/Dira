import { createOpenRouterClient, hasOpenRouter } from '../lib/openrouter.js'
import { env } from '../config/env.js'
import {
  computeProgressSummary,
  roadmapDataSchema,
  type PathwayStep,
  type RoadmapData,
} from '../types/careerPathwayRoadmap.js'

/** UI timeline shows top N; stored roadmap includes every gap/upskill skill. */
export const MAX_TIMELINE_STEPS = 6

const PATHWAY_LLM_TIMEOUT_MS = 4000

type AiStepPatch = {
  id: string
  description?: string
  suggestedDurationWeeks?: number
  upskillActions?: string
  completionKpi?: string
}

function llmEnrichmentTimedOut(): Promise<Map<string, AiStepPatch>> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(new Map()), PATHWAY_LLM_TIMEOUT_MS)
  })
}

type PrioritisedPlanStep = {
  order?: number
  skill: string
  priority?: string
  action: string
  estimatedTimeLabel?: string
}

type ReportSkillRow = {
  name: string
  skillId?: number
  status?: string
}

type GapReportShape = {
  targetRole?: string
  pathwayRole?: { roleId?: number | null; title?: string } | null
  prioritisedPlan?: PrioritisedPlanStep[]
  upskills?: string[]
  gaps?: string[]
  skills?: ReportSkillRow[]
}

function slugId(skillName: string, order: number): string {
  const base = skillName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `step-${order}-${base || 'skill'}`
}

function parseWeeksFromLabel(label: string | undefined): number | undefined {
  if (!label) return undefined
  const nums = label.match(/\d+/g)
  if (!nums?.length) return undefined
  const n = parseInt(nums[0]!, 10)
  if (!Number.isFinite(n) || n < 1) return undefined
  return Math.min(52, n)
}

function skillIdFromReport(report: GapReportShape, skillName: string): number | null {
  const skills = report.skills
  if (!skills?.length) return null
  const row = skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase())
  return typeof row?.skillId === 'number' ? row.skillId : null
}

function planMetaBySkill(report: GapReportShape): Map<string, PrioritisedPlanStep> {
  const map = new Map<string, PrioritisedPlanStep>()
  for (const p of report.prioritisedPlan ?? []) {
    map.set(p.skill.trim().toLowerCase(), p)
  }
  return map
}

function buildSeedSteps(report: GapReportShape): Omit<PathwayStep, 'upskillActions' | 'completionKpi'>[] {
  const planMeta = planMetaBySkill(report)
  const seen = new Set<string>()
  const ordered: Array<{ skill: string; priority?: string; action: string; estimatedTimeLabel?: string }> =
    []

  const devSkills = (report.skills ?? []).filter((s) => s.status === 'gap' || s.status === 'upskill')
  if (devSkills.length) {
    for (const p of report.prioritisedPlan ?? []) {
      const key = p.skill.trim().toLowerCase()
      if (seen.has(key)) continue
      if (!devSkills.some((s) => s.name.toLowerCase() === key)) continue
      seen.add(key)
      ordered.push(p)
    }
    for (const row of devSkills) {
      const key = row.name.trim().toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      const meta = planMeta.get(key)
      ordered.push({
        skill: row.name.trim(),
        priority: row.status === 'gap' ? 'gap' : 'upskill',
        action: meta?.action ?? (row.status === 'gap' ? `Learn ${row.name}` : `Improve ${row.name}`),
        estimatedTimeLabel: meta?.estimatedTimeLabel,
      })
    }
  } else {
    for (const p of report.prioritisedPlan ?? []) {
      const key = p.skill.trim().toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      ordered.push(p)
    }
    for (const name of [...(report.gaps ?? []), ...(report.upskills ?? [])]) {
      const key = name.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      ordered.push({
        skill: name.trim(),
        action: `Improve ${name.trim()}`,
        estimatedTimeLabel: '2-4 weeks',
      })
    }
  }

  return ordered.map((p, i) => {
    const order = i + 1
    const skillName = p.skill.trim()
    const weeks = parseWeeksFromLabel(p.estimatedTimeLabel)
    return {
      id: slugId(skillName, order),
      order,
      skillName,
      skillId: skillIdFromReport(report, skillName),
      title: p.action?.trim() || `Work on ${skillName}`,
      description: p.priority === 'gap' ? `Close the gap in ${skillName}.` : `Strengthen ${skillName}.`,
      suggestedDurationWeeks: weeks ?? 3,
      startDate: null,
      endDate: null,
      status: 'not_started' as const,
      aiSuggested: true,
    }
  })
}

function fallbackEnrich(steps: ReturnType<typeof buildSeedSteps>): PathwayStep[] {
  return steps.map((s) => ({
    ...s,
    upskillActions: `Follow curated resources for ${s.skillName}; practice weekly and track progress.`,
    completionKpi: `Can explain ${s.skillName} at interview level and complete one small project or exercise.`,
  }))
}

function parseJsonBlock(text: string): unknown {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fence ? fence[1]!.trim() : trimmed
  return JSON.parse(raw)
}

async function enrichWithOpenRouter(
  targetRole: string,
  steps: ReturnType<typeof buildSeedSteps>
): Promise<Map<string, AiStepPatch>> {
  const patchById = new Map<string, AiStepPatch>()
  if (!hasOpenRouter() || steps.length === 0) return patchById

  const top = steps.slice(0, MAX_TIMELINE_STEPS)
  const client = createOpenRouterClient()
  const payload = top.map((s) => ({
    id: s.id,
    skillName: s.skillName,
    title: s.title,
    suggestedDurationWeeks: s.suggestedDurationWeeks,
  }))

  const completion = await client.chat.completions.create({
    model: env.OPENROUTER_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'You create concise career upskilling plans for students. Respond with JSON only: { "steps": [ { "id", "description", "suggestedDurationWeeks", "upskillActions", "completionKpi" } ] }. Keep each field under 280 chars where possible.',
      },
      {
        role: 'user',
        content: `Target role: ${targetRole}\nSteps JSON:\n${JSON.stringify(payload)}`,
      },
    ],
  })

  const text = completion.choices[0]?.message?.content
  if (!text || typeof text !== 'string') return patchById

  let parsed: { steps?: AiStepPatch[] }
  try {
    parsed = parseJsonBlock(text) as { steps?: AiStepPatch[] }
  } catch {
    return patchById
  }
  if (!Array.isArray(parsed.steps)) return patchById

  for (const s of parsed.steps) {
    if (s?.id) patchById.set(s.id, s)
  }
  return patchById
}

function applyEnrichment(
  seed: ReturnType<typeof buildSeedSteps>,
  patchById: Map<string, AiStepPatch>
): PathwayStep[] {
  return seed.map((s) => {
    const patch = patchById.get(s.id)
    return {
      ...s,
      description: patch?.description?.trim() || s.description,
      suggestedDurationWeeks:
        typeof patch?.suggestedDurationWeeks === 'number' && patch.suggestedDurationWeeks >= 1
          ? Math.min(52, Math.round(patch.suggestedDurationWeeks))
          : s.suggestedDurationWeeks,
      upskillActions:
        patch?.upskillActions?.trim() ||
        `Study ${s.skillName}, complete exercises, and apply it in a mini project.`,
      completionKpi:
        patch?.completionKpi?.trim() ||
        `Demonstrate ${s.skillName} in a portfolio piece or mock interview.`,
    }
  })
}

export type GenerateRoadmapInput = {
  report: GapReportShape
  sourceAnalysisId: number | null
  pathwayRoleId: number | null
}

export async function generateCareerPathwayRoadmap(input: GenerateRoadmapInput): Promise<RoadmapData> {
  const targetRole =
    input.report.targetRole?.trim() ||
    input.report.pathwayRole?.title?.trim() ||
    'Your target role'

  const pathwayRoleId =
    input.pathwayRoleId ??
    (typeof input.report.pathwayRole?.roleId === 'number' ? input.report.pathwayRole.roleId : null)

  const seed = buildSeedSteps(input.report)
  if (seed.length === 0) {
    throw new Error('No skills to plan from; run skills analysis first')
  }

  let steps: PathwayStep[]
  const fallbackSteps = fallbackEnrich(seed)
  if (env.pathwaySkipLlm) {
    steps = fallbackSteps
  } else {
    try {
      const patches = await Promise.race([
        enrichWithOpenRouter(targetRole, seed),
        llmEnrichmentTimedOut(),
      ])
      steps = patches.size > 0 ? applyEnrichment(seed, patches) : fallbackSteps
    } catch {
      steps = fallbackSteps
    }
  }

  const generatedAt = new Date().toISOString()
  const progressSummary = computeProgressSummary(steps)

  const roadmap: RoadmapData = {
    schemaVersion: 1,
    targetRole,
    pathwayRoleId,
    sourceAnalysisId: input.sourceAnalysisId,
    generatedAt,
    progressSummary,
    steps,
  }

  return roadmapDataSchema.parse(roadmap)
}
