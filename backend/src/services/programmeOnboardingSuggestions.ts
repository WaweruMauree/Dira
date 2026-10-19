import OpenAI from 'openai'
import { assertOpenRouterConfigured, createOpenRouterClient, hasOpenRouter } from '../lib/openrouter.js'
import { env } from '../config/env.js'
import { searchExa } from '../lib/exa.js'
import { staticProgrammeFallback } from '../constants/courseSkillProfiles.js'
import { PUNCTUATION_STYLE_RULE } from '../lib/copyStyle.js'

export type ProgrammeSuggestionsResult = {
  technicalSkills: string[]
  softSkills: string[]
  careerInterests: string[]
  programmeSector: string | null
  source: 'ai' | 'fallback'
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

type CacheEntry = { value: ProgrammeSuggestionsResult; expiresAt: number }

const memoryCache = new Map<string, CacheEntry>()

function cacheKey(courseCatalogId: string, programmeLabel: string): string {
  return `${courseCatalogId.trim().toUpperCase()}|${programmeLabel.trim().toLowerCase()}`
}

function parseJsonBlock(text: string): unknown {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fence ? fence[1]!.trim() : trimmed
  return JSON.parse(raw)
}

function dedupeStrings(items: string[], maxLen: number, maxCount: number): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const trimmed = item.trim().slice(0, maxLen)
    if (trimmed.length < 2) continue
    const lower = trimmed.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    out.push(trimmed)
    if (out.length >= maxCount) break
  }
  return out
}

function normalizeLists(parsed: {
  technicalSkills?: unknown
  softSkills?: unknown
  careerInterests?: unknown
  programmeSector?: unknown
}): ProgrammeSuggestionsResult | null {
  const technical = dedupeStrings(
    Array.isArray(parsed.technicalSkills) ? parsed.technicalSkills.map(String) : [],
    150,
    14
  )
  const soft = dedupeStrings(
    Array.isArray(parsed.softSkills) ? parsed.softSkills.map(String) : [],
    150,
    10
  )
  const interests = dedupeStrings(
    Array.isArray(parsed.careerInterests) ? parsed.careerInterests.map(String) : [],
    150,
    12
  )
  if (technical.length < 4 || soft.length < 3 || interests.length < 4) return null
  const sector =
    typeof parsed.programmeSector === 'string' && parsed.programmeSector.trim()
      ? parsed.programmeSector.trim().slice(0, 80)
      : null
  return {
    technicalSkills: technical,
    softSkills: soft,
    careerInterests: interests,
    programmeSector: sector,
    source: 'ai',
  }
}

export async function getProgrammeOnboardingSuggestions(input: {
  courseCatalogId: string
  programmeLabel: string
}): Promise<ProgrammeSuggestionsResult> {
  const courseCatalogId = input.courseCatalogId.trim() || 'OTHER'
  const programmeLabel = input.programmeLabel.trim()
  const key = cacheKey(courseCatalogId, programmeLabel)

  const cached = memoryCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const fallback = (): ProgrammeSuggestionsResult => ({
    ...staticProgrammeFallback(courseCatalogId),
    source: 'fallback',
  })

  if (!hasOpenRouter()) {
    const value = fallback()
    memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
    return value
  }

  try {
    assertOpenRouterConfigured()
    const query = `${programmeLabel} degree programme skills competencies career paths portfolio entrepreneurship Kenya`
    const exaResults = await searchExa(query)
    const webContext = exaResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}`)
      .join('\n\n')

    const client = createOpenRouterClient()
    const completion = await client.chat.completions.create({
      model: env.OPENROUTER_MODEL,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You tailor university onboarding skill lists to a specific degree or programme.
Return JSON only:
{
  "technicalSkills": string[],
  "softSkills": string[],
  "careerInterests": string[],
  "programmeSector": string | null
}
Rules:
- technicalSkills: 8-12 programme-specific skills, tools, or craft competencies (e.g. music theory, DAW, culinary knife skills, CAD, business planning; NOT generic CS unless the programme is IT/computing).
- softSkills: 6-8 interpersonal and professional skills relevant to graduates of this programme.
- careerInterests: 7-10 realistic career paths including creative, freelance, studio, hospitality, practice, startup, and non-corporate options when appropriate.
- programmeSector: short tag like creative, culinary, built_environment, business, technology, law, hospitality, or general.
Use web snippets when provided; otherwise use reliable knowledge. Skill names should be short labels suitable for a checklist.
${PUNCTUATION_STYLE_RULE}`,
        },
        {
          role: 'user',
          content: `Programme / course of study: ${programmeLabel}
Catalog id (hint): ${courseCatalogId}

Web research snippets:
${webContext || '(No web snippets; use programme-specific industry knowledge.)'}`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      const value = fallback()
      memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
      return value
    }

    let parsed: unknown
    try {
      parsed = parseJsonBlock(content)
    } catch {
      const value = fallback()
      memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
      return value
    }

    const normalized = normalizeLists(parsed as Record<string, unknown>)
    const value = normalized ?? fallback()
    memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
    return value
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      console.error('[programmeOnboardingSuggestions] OpenRouter error:', err.status, err.message)
    } else {
      console.error('[programmeOnboardingSuggestions]', err)
    }
    const value = fallback()
    memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
    return value
  }
}
