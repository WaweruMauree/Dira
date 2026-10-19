import { env } from '../config/env.js'

export type ExaSearchResult = {
  title: string
  url: string
  snippet: string
}

export function hasExaKey(): boolean {
  return env.EXA_API_KEY.length > 0
}

export async function searchExa(query: string): Promise<ExaSearchResult[]> {
  if (!hasExaKey()) return []

  const res = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.EXA_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      type: 'auto',
      numResults: 6,
      contents: {
        highlights: true,
        text: { maxCharacters: 600 },
      },
    }),
  })

  if (!res.ok) return []

  const json = (await res.json()) as {
    results?: Array<{
      title?: string
      url?: string
      highlights?: string[]
      text?: string
    }>
  }

  return (json.results ?? []).map((item) => ({
    title: item.title || item.url || 'Source',
    url: item.url || '',
    snippet: item.highlights?.[0] || (item.text ? item.text.slice(0, 400) : ''),
  }))
}
