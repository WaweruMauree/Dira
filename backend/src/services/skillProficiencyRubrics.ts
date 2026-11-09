import OpenAI from 'openai'
import { env } from '../config/env.js'
import { HttpError } from '../middleware/error.js'
import { assertOpenRouterConfigured, createOpenRouterClient } from '../lib/openrouter.js'
import { sanitizeAiPunctuation } from '../lib/copyStyle.js'
import {
  buildRubricSystemPrompt,
  buildRubricUserPrompt,
  type SkillProficiencyRubric,
  type SkillRubricCategory,
  SKILL_LEVEL_IDS,
} from '../lib/skillLevelFramework.js'
import { buildGenericSkillRubric } from '../lib/genericSkillRubric.js'

const CACHE_VERSION = 'v1'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const BATCH_SIZE = 6

type CacheEntry = { rubric: SkillProficiencyRubric; expiresAt: number }

const memoryCache = new Map<string, CacheEntry>()

function cacheKey(courseCatalogId: string, category: SkillRubricCategory, skillName: string): string {
  return `${CACHE_VERSION}|${courseCatalogId}|${category}|${skillName.trim().toLowerCase()}`
}

function parseJsonBlock(text: string): unknown {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fence ? fence[1]!.trim() : trimmed
  return JSON.parse(raw)
}

function normalizeLevelSlice(raw: unknown): SkillProficiencyRubric['levels']['1'] | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as { summary?: unknown; criteria?: unknown }
  const summary =
    typeof o.summary === 'string' ? sanitizeAiPunctuation(o.summary.trim()).slice(0, 120) : ''
  const criteria = Array.isArray(o.criteria)
    ? o.criteria
        .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
        .map((c) => sanitizeAiPunctuation(c.trim()).slice(0, 100))
        .slice(0, 3)
    : []
  if (!summary || criteria.length === 0) return null
  return { summary, criteria }
}

function normalizeRubric(raw: unknown, expectedName: string, expectedCategory: SkillRubricCategory): SkillProficiencyRubric | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as {
    skillName?: string
    category?: string
    levels?: Record<string, unknown>
  }
  const levelsRaw = o.levels
  if (!levelsRaw || typeof levelsRaw !== 'object') return null

  const l1 = normalizeLevelSlice(levelsRaw['1'])
  const l3 = normalizeLevelSlice(levelsRaw['3'])
  const l5 = normalizeLevelSlice(levelsRaw['5'])
  if (!l1 || !l3 || !l5) return null

  return {
    skillName: typeof o.skillName === 'string' ? o.skillName.trim() : expectedName,
    category: expectedCategory,
    levels: { '1': l1, '3': l3, '5': l5 },
  }
}

function getCached(courseCatalogId: string, item: { skillName: string; category: SkillRubricCategory }) {
  const key = cacheKey(courseCatalogId, item.category, item.skillName)
  const hit = memoryCache.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key)
    return null
  }
  return hit.rubric
}

function setCached(courseCatalogId: string, rubric: SkillProficiencyRubric) {
  const key = cacheKey(courseCatalogId, rubric.category, rubric.skillName)
  memoryCache.set(key, { rubric, expiresAt: Date.now() + CACHE_TTL_MS })
}

async function generateBatch(
  courseCatalogId: string,
  courseLabel: string,
  items: Array<{ skillName: string; category: SkillRubricCategory }>
): Promise<SkillProficiencyRubric[]> {
  assertOpenRouterConfigured()
  const client = createOpenRouterClient()

  let completion: OpenAI.Chat.Completions.ChatCompletion
  try {
    const rubricModel = env.OPENROUTER_RUBRIC_MODEL || env.OPENROUTER_MODEL
    completion = await client.chat.completions.create({
      model: rubricModel,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildRubricSystemPrompt() },
        {
          role: 'user',
          content: buildRubricUserPrompt({ courseCatalogId, courseLabel, items }),
        },
      ],
    })
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401 || err.status === 403) {
        throw new HttpError(502, 'Invalid or unauthorized OpenRouter API key.')
      }
      if (err.status === 429) {
        throw new HttpError(502, 'OpenRouter rate limit exceeded. Try again shortly.')
      }
      throw new HttpError(502, 'OpenRouter could not generate skill rubrics.')
    }
    throw err
  }

  const content = completion.choices[0]?.message?.content
  if (!content) throw new HttpError(502, 'Empty rubric response from model')

  let parsed: { rubrics?: unknown[] }
  try {
    parsed = parseJsonBlock(content) as { rubrics?: unknown[] }
  } catch {
    throw new HttpError(502, 'Invalid rubric JSON from model')
  }

  const byName = new Map<string, unknown>()
  for (const row of parsed.rubrics ?? []) {
    if (row && typeof row === 'object' && 'skillName' in row) {
      byName.set(String((row as { skillName: string }).skillName).trim().toLowerCase(), row)
    }
  }

  const out: SkillProficiencyRubric[] = []
  for (const item of items) {
    const raw = byName.get(item.skillName.trim().toLowerCase())
    const rubric = normalizeRubric(raw, item.skillName, item.category)
    if (rubric) {
      out.push(rubric)
      setCached(courseCatalogId, rubric)
    }
  }

  if (out.length === 0) {
    return items.map((item) => buildGenericSkillRubric(item.skillName, item.category))
  }

  return out
}

export async function getRubricsForSkills(input: {
  courseCatalogId: string
  courseLabel: string
  items: Array<{ skillName: string; category: SkillRubricCategory }>
}): Promise<Record<string, SkillProficiencyRubric>> {
  if (input.items.length === 0) return {}

  const result: Record<string, SkillProficiencyRubric> = {}
  const missing: Array<{ skillName: string; category: SkillRubricCategory }> = []

  for (const item of input.items) {
    const cached = getCached(input.courseCatalogId, item)
    if (cached) {
      result[item.skillName] = cached
    } else {
      missing.push(item)
    }
  }

  const chunks: Array<Array<{ skillName: string; category: SkillRubricCategory }>> = []
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    chunks.push(missing.slice(i, i + BATCH_SIZE))
  }
  for (const chunk of chunks) {
    try {
      const generated = await generateBatch(input.courseCatalogId, input.courseLabel, chunk)
      for (const rubric of generated) {
        result[rubric.skillName] = rubric
      }
    } catch {
      for (const item of chunk) {
        if (!result[item.skillName]) {
          const generic = buildGenericSkillRubric(item.skillName, item.category)
          result[item.skillName] = generic
          setCached(input.courseCatalogId, generic)
        }
      }
    }
  }

  for (const item of missing) {
    if (!result[item.skillName]) {
      const generic = buildGenericSkillRubric(item.skillName, item.category)
      result[item.skillName] = generic
    }
  }

  // Ensure all SKILL_LEVEL_IDS are present in each rubric (validated at normalize)
  for (const key of Object.keys(result)) {
    const r = result[key]!
    for (const id of SKILL_LEVEL_IDS) {
      if (!r.levels[String(id) as '1' | '3' | '5']) {
        delete result[key]
      }
    }
  }

  return result
}
