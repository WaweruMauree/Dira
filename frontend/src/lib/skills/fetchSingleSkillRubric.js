import { diraApi } from '@/lib/api/dira'
import { readCachedRubric, writeCachedRubric } from '@/lib/skills/rubricCache'

/** @type {Map<string, Promise<unknown>>} */
const inFlight = new Map()

function flightKey(courseCatalogId, category, skillName) {
  return `${courseCatalogId}|${category}|${skillName.trim().toLowerCase()}`
}

/**
 * @param {{
 *   token: string
 *   courseCatalogId: string
 *   courseLabel: string
 *   skillName: string
 *   category: 'TECHNICAL' | 'SOFT'
 * }} params
 */
export async function fetchSingleSkillRubric(params) {
  const { token, courseCatalogId, courseLabel, skillName, category } = params
  const cached = readCachedRubric(courseCatalogId, category, skillName)
  if (cached) return cached

  const key = flightKey(courseCatalogId, category, skillName)
  const existing = inFlight.get(key)
  if (existing) return existing

  const promise = diraApi
    .fetchSkillProficiencyRubrics(token, {
      courseCatalogId,
      courseLabel: courseLabel || courseCatalogId,
      items: [{ skillName, category }],
    })
    .then(({ rubrics }) => {
      const rubric = rubrics?.[skillName] ?? Object.values(rubrics ?? {})[0]
      if (rubric) {
        const cat = rubric.category === 'SOFT' ? 'SOFT' : 'TECHNICAL'
        writeCachedRubric(courseCatalogId, cat, skillName, rubric)
      }
      return rubric ?? null
    })
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, promise)
  return promise
}
