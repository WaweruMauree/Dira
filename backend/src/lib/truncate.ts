export function truncateVarchar(value: string | null | undefined, max: number): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

export function truncateTags(tags: string[] | undefined, maxLen = 100, maxItems = 20): string[] {
  if (!tags?.length) return []
  return tags
    .slice(0, maxItems)
    .map((t) => truncateVarchar(t, maxLen))
    .filter((t): t is string => Boolean(t))
}
