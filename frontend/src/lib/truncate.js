export function truncateVarchar(value, max) {
  if (value == null) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}
