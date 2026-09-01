export type ExaResult = {
  title: string
  url: string
  snippet: string
  source: 'exa'
  publishedDate?: string | null
}

export async function searchExa(query: string): Promise<ExaResult[]> {
  const key = import.meta.env.VITE_EXA_API_KEY as string | undefined
  if (!key) {
    throw new Error('VITE_EXA_API_KEY is not set')
  }

  const res = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      query,
      type: 'auto',
      numResults: 8,
      contents: {
        highlights: true,
        text: { maxCharacters: 500 },
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Exa search failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    results?: Array<{
      title?: string
      url?: string
      highlights?: string[]
      text?: string
      publishedDate?: string | null
    }>
  }

  return (json.results ?? []).map((item) => ({
    title: item.title || item.url || 'Result',
    url: item.url || '',
    snippet: item.highlights?.[0] || (item.text ? item.text.slice(0, 280) : ''),
    source: 'exa' as const,
    publishedDate: item.publishedDate ?? null,
  }))
}
