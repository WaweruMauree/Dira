import { assertOpenRouterConfigured, createOpenRouterClient, mapOpenRouterError } from '../lib/openrouter.js'
import { env } from '../config/env.js'
import { searchExa } from '../lib/exa.js'
import { HttpError } from '../middleware/error.js'
import { PUNCTUATION_STYLE_RULE, sanitizeAiPunctuation } from '../lib/copyStyle.js'
import { fallbackRoleSkills } from '../constants/roleSkillFallbacks.js'

export type WebSourcedRoleSkill = {
  name: string
  category: 'TECH' | 'SOFT' | null
  requiredLevel: number
  rationale?: string
}

const VALID_LEVELS = new Set([1, 3, 5])

function parseJsonBlock(text: string): unknown {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fence ? fence[1]!.trim() : trimmed
  return JSON.parse(raw)
}

export async function fetchRequiredSkillsForRoleFromWeb(
  targetRole: string,
  studentSkillNames: string[]
): Promise<{
  roleTitle: string
  seniority: string | null
  skills: WebSourcedRoleSkill[]
  sources: Array<{ title: string; url: string }>
  extractionMethod: string
}> {
  const useFallback = () => {
    const fb = fallbackRoleSkills(targetRole)
    if (!fb) throw new HttpError(502, 'Could not determine skills for this role.')
    return {
      roleTitle: fb.roleTitle,
      seniority: null as string | null,
      skills: fb.skills,
      sources: [] as Array<{ title: string; url: string }>,
      extractionMethod: fb.extractionMethod,
    }
  }

  try {
    assertOpenRouterConfigured()
  } catch {
    return useFallback()
  }

  const query = `${targetRole} role required skills competencies job description`
  const exaResults = await searchExa(query)
  const sources = exaResults.map((r) => ({ title: r.title, url: r.url })).filter((s) => s.url)

  const webContext = exaResults
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}`)
    .join('\n\n')

  const client = createOpenRouterClient()
  let completion
  try {
    completion = await client.chat.completions.create({
      model: env.OPENROUTER_MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a career analyst. Given a target job/career interest and optional web research snippets, list 8-14 skills commonly required for that role today.
Return JSON only:
{
  "roleTitle": string,
  "seniority": "entry"|"mid"|"senior"|null,
  "skills": [{ "name": string, "category": "TECH"|"SOFT"|null, "requiredLevel": 1|3|5, "rationale": string }]
}
requiredLevel: 1=Beginner, 3=Intermediate, 5=Expert. Base levels on typical employer expectations for the role.
Use web snippets when provided; otherwise use reliable industry knowledge. Do not invent employer names.
${PUNCTUATION_STYLE_RULE}`,
        },
        {
          role: 'user',
          content: `Target role / career interest: ${targetRole}

Student already has these skills (from onboarding): ${studentSkillNames.slice(0, 40).join(', ') || 'none listed'}

Web research snippets:
${webContext || '(No web snippets; use industry-standard requirements for this role.)'}`,
        },
      ],
    })
  } catch (err) {
    if (err instanceof HttpError) {
      console.warn('[roleSkillsFromAgent] OpenRouter unavailable, using fallback:', err.message)
    } else {
      console.warn('[roleSkillsFromAgent] OpenRouter error, using fallback:', mapOpenRouterError(err).message)
    }
    return useFallback()
  }

  const content = completion.choices[0]?.message?.content
  if (!content) {
    console.warn('[roleSkillsFromAgent] empty LLM response, using fallback')
    return useFallback()
  }

  let parsed: {
    roleTitle?: string
    seniority?: string | null
    skills?: Array<{
      name?: string
      category?: string | null
      requiredLevel?: number
      rationale?: string
    }>
  }

  try {
    parsed = parseJsonBlock(content) as typeof parsed
  } catch {
    console.warn('[roleSkillsFromAgent] invalid JSON, using fallback')
    return useFallback()
  }

  const skills: WebSourcedRoleSkill[] = (parsed.skills ?? [])
    .filter((s) => s.name && String(s.name).trim().length > 1)
    .map((s): WebSourcedRoleSkill => {
      const cat: WebSourcedRoleSkill['category'] =
        s.category === 'TECH' || s.category === 'SOFT' ? s.category : null
      return {
        name: String(s.name).trim(),
        category: cat,
        requiredLevel: VALID_LEVELS.has(Number(s.requiredLevel)) ? Number(s.requiredLevel) : 3,
        rationale: s.rationale ? sanitizeAiPunctuation(String(s.rationale)) : undefined,
      }
    })
    .slice(0, 16)

  if (skills.length === 0) {
    console.warn('[roleSkillsFromAgent] no skills parsed, using fallback')
    return useFallback()
  }

  const extractionMethod = sources.length
    ? 'exa_web_search_plus_llm_structuring'
    : 'llm_industry_benchmark'

  return {
    roleTitle: parsed.roleTitle?.trim() || targetRole,
    seniority: parsed.seniority ?? null,
    skills,
    sources,
    extractionMethod,
  }
}
