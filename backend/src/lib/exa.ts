import { env } from '../config/env.js'

export type ExaSearchResult = {
  title: string
  url: string
  snippet: string
  excerpt: string
}

export function hasExaKey(): boolean {
  return env.EXA_API_KEY.length > 0
}

type ExaRawResult = {
  title?: string
  url?: string
  highlights?: string[]
  text?: string
}

function mapExaResult(item: ExaRawResult, excerptLen: number): ExaSearchResult {
  const text = item.text ?? ''
  const snippet = item.highlights?.[0] || text.slice(0, 280)
  const excerpt = text.slice(0, excerptLen) || snippet
  return {
    title: item.title || item.url || 'Source',
    url: item.url || '',
    snippet,
    excerpt,
  }
}

const EXA_TIMEOUT_MS = 8_000

async function exaSearch(query: string, numResults: number, excerptLen: number): Promise<ExaSearchResult[]> {
  if (!hasExaKey()) return []

  let res: Response
  try {
    res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.EXA_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        type: 'auto',
        numResults,
        contents: {
          highlights: true,
          text: { maxCharacters: excerptLen },
        },
      }),
      signal: AbortSignal.timeout(EXA_TIMEOUT_MS),
    })
  } catch {
    return []
  }

  if (!res.ok) return []

  const json = (await res.json()) as { results?: ExaRawResult[] }
  return (json.results ?? []).map((item) => mapExaResult(item, excerptLen))
}

/** Quick search (6 results, shorter excerpts). */
export async function searchExa(query: string): Promise<ExaSearchResult[]> {
  return exaSearch(query, 6, 600)
}

/** Deep search for agent research (10 results, longer excerpts). */
export async function searchExaDeep(query: string): Promise<ExaSearchResult[]> {
  return exaSearch(query, 10, 1500)
}

export async function searchExaWithDepth(
  query: string,
  depth: 'quick' | 'deep' = 'quick'
): Promise<ExaSearchResult[]> {
  return depth === 'deep' ? searchExaDeep(query) : searchExa(query)
}
