function asText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => asText(item)).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>
    return String(rec.name ?? rec.title ?? rec.display_name ?? JSON.stringify(value))
  }
  return String(value)
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function mapExperienceLevel(raw: unknown): number | null {
  const text = asText(raw).toLowerCase()
  if (!text) return null
  if (text.includes('intern') || text.includes('entry') || text.includes('junior') || text.includes('1')) return 1
  if (text.includes('mid')) return 3
  if (text.includes('senior') || text.includes('lead')) return 4
  if (text.includes('specialist') || text.includes('staff') || text.includes('principal')) return 5
  const n = Number(raw)
  if (Number.isFinite(n) && n >= 1 && n <= 5) return n
  return 2
}

export function toIsoDate(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    const ms = value > 1e12 ? value : value * 1000
    return new Date(ms).toISOString()
  }
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export { asText }
