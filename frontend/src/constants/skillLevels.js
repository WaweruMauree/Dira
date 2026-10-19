export const DEFAULT_SKILL_LEVEL = 3

export const SKILL_LEVEL_OPTIONS = [
  { id: 1, label: 'Beginner', shortLabel: 'B' },
  { id: 3, label: 'Intermediate', shortLabel: 'I' },
  { id: 5, label: 'Expert', shortLabel: 'E' },
]

const ALLOWED = new Set(SKILL_LEVEL_OPTIONS.map((o) => o.id))

export function normalizeSkillLevel(level) {
  if (ALLOWED.has(level)) return level
  return DEFAULT_SKILL_LEVEL
}

export function skillLevelLabel(level) {
  const option = SKILL_LEVEL_OPTIONS.find((o) => o.id === level)
  return option?.label ?? 'Intermediate'
}
