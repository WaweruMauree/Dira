export function parseWebSearchToolOutput(output) {
  if (!output || typeof output !== 'object') return []
  const results = output.results
  if (!Array.isArray(results)) return []
  return results
    .filter((r) => r && (r.url || r.title))
    .map((r) => ({
      title: String(r.title ?? 'Link'),
      url: String(r.url ?? ''),
      snippet: r.snippet ? String(r.snippet) : null,
    }))
}

export function mergeWebSearchRecs(prev, query, output) {
  const items = parseWebSearchToolOutput(output)
  if (!items.length) return prev
  const key = String(query ?? output?.query ?? 'search')
  return [...prev.filter((g) => g.query !== key), { query: key, items }]
}
