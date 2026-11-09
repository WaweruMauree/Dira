/** Case- and whitespace-insensitive key for career interest / target_role strings. */
export function normalizeTargetRole(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function targetRolesMatch(a: string, b: string): boolean {
  return normalizeTargetRole(a) === normalizeTargetRole(b)
}
