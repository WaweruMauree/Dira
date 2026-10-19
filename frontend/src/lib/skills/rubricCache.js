export const CACHE_PREFIX = 'dira-rubric-v1|'
const HEALTH_CACHE_KEY = 'dira-openrouter-health-v1'
const HEALTH_TTL_MS = 5 * 60 * 1000

export function rubricStorageKey(courseCatalogId, category, skillName) {
  return `${CACHE_PREFIX}${courseCatalogId}|${category}|${skillName.trim().toLowerCase()}`
}

export function readCachedRubric(courseCatalogId, category, skillName) {
  try {
    const raw = sessionStorage.getItem(rubricStorageKey(courseCatalogId, category, skillName))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function writeCachedRubric(courseCatalogId, category, skillName, rubric) {
  try {
    sessionStorage.setItem(rubricStorageKey(courseCatalogId, category, skillName), JSON.stringify(rubric))
  } catch {
    /* quota */
  }
}

/**
 * @param {string} courseCatalogId
 * @param {Array<{ skillName: string, category: 'TECHNICAL' | 'SOFT' }>} items
 */
export function hydrateRubricsForItems(courseCatalogId, items) {
  /** @type {Record<string, unknown>} */
  const rubricsBySkill = {}
  /** @type {Array<{ skillName: string, category: 'TECHNICAL' | 'SOFT' }>} */
  const missingItems = []

  for (const item of items) {
    const hit = readCachedRubric(courseCatalogId, item.category, item.skillName)
    if (hit) rubricsBySkill[item.skillName] = hit
    else missingItems.push(item)
  }

  return { rubricsBySkill, missingItems }
}

export function readCachedOpenRouterHealth() {
  try {
    const raw = sessionStorage.getItem(HEALTH_CACHE_KEY)
    if (!raw) return null
    const { enabled, at } = JSON.parse(raw)
    if (Date.now() - at > HEALTH_TTL_MS) return null
    return Boolean(enabled)
  } catch {
    return null
  }
}

export function writeCachedOpenRouterHealth(enabled) {
  try {
    sessionStorage.setItem(HEALTH_CACHE_KEY, JSON.stringify({ enabled, at: Date.now() }))
  } catch {
    /* ignore */
  }
}
