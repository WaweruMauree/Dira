const CACHE_PREFIX = 'dira:programme-suggestions:'
const TTL_MS = 7 * 24 * 60 * 60 * 1000

export function normalizeProgrammeLabel(label) {
  return (label || '').trim().toLowerCase()
}

export function programmeSuggestionsStorageKey(courseCatalogId, programmeLabel) {
  const catalog = (courseCatalogId || 'OTHER').trim().toUpperCase()
  const label = normalizeProgrammeLabel(programmeLabel)
  return `${CACHE_PREFIX}${catalog}|${label}`
}

/**
 * @returns {{ technicalSkills: string[], softSkills: string[], careerInterests: string[], programmeSector?: string | null, source: 'ai' | 'fallback' } | null}
 */
export function readCachedProgrammeSuggestions(courseCatalogId, programmeLabel) {
  try {
    const raw = sessionStorage.getItem(programmeSuggestionsStorageKey(courseCatalogId, programmeLabel))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      sessionStorage.removeItem(programmeSuggestionsStorageKey(courseCatalogId, programmeLabel))
      return null
    }
    return parsed.data ?? null
  } catch {
    return null
  }
}

export function writeCachedProgrammeSuggestions(courseCatalogId, programmeLabel, data) {
  try {
    sessionStorage.setItem(
      programmeSuggestionsStorageKey(courseCatalogId, programmeLabel),
      JSON.stringify({ savedAt: Date.now(), data })
    )
  } catch {
    /* quota */
  }
}
