import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'
import {
  hydrateRubricsForItems,
  readCachedRubric,
  readCachedOpenRouterHealth,
  writeCachedOpenRouterHealth,
  writeCachedRubric,
} from '@/lib/skills/rubricCache'
import { fetchSingleSkillRubric } from '@/lib/skills/fetchSingleSkillRubric'
import { buildGenericSkillRubric } from '@/lib/skills/genericSkillRubric'

function buildItems(technicalSkills, softSkills) {
  return [
    ...technicalSkills.map((skillName) => ({ skillName, category: 'TECHNICAL' })),
    ...softSkills.map((skillName) => ({ skillName, category: 'SOFT' })),
  ]
}

/**
 * @param {{
 *   courseCatalogId: string
 *   courseLabel: string
 *   technicalSkills: string[]
 *   softSkills: string[]
 *   presetTechnicalSkills?: string[]
 *   presetSoftSkills?: string[]
 * }} params
 */
export function useSkillProficiencyRubrics({
  courseCatalogId,
  courseLabel,
  technicalSkills,
  softSkills,
  presetTechnicalSkills = [],
  presetSoftSkills = [],
}) {
  const { getAccessToken } = useAuth()
  const [rubricsBySkill, setRubricsBySkill] = useState({})
  const [loading] = useState(false)
  const [openRouterEnabled, setOpenRouterEnabled] = useState(() => readCachedOpenRouterHealth() ?? false)
  useEffect(() => {
    let cancelled = false
    const cached = readCachedOpenRouterHealth()
    if (cached !== null) {
      setOpenRouterEnabled(cached)
      return
    }
    diraApi
      .getHealth()
      .then((h) => {
        const enabled = Boolean(h.features?.openRouter)
        writeCachedOpenRouterHealth(enabled)
        if (!cancelled) setOpenRouterEnabled(enabled)
      })
      .catch(() => {
        if (!cancelled) setOpenRouterEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const items = useMemo(
    () => buildItems(technicalSkills, softSkills),
    [technicalSkills, softSkills]
  )

  const presetSignature = useMemo(() => {
    const tech = [...presetTechnicalSkills].sort().join('\0')
    const soft = [...presetSoftSkills].sort().join('\0')
    return `${courseCatalogId}|${tech}|${soft}`
  }, [courseCatalogId, presetTechnicalSkills, presetSoftSkills])

  const fullSignature = useMemo(() => {
    const tech = [...technicalSkills].sort().join('\0')
    const soft = [...softSkills].sort().join('\0')
    return `${courseCatalogId}|${tech}|${soft}`
  }, [courseCatalogId, technicalSkills, softSkills])

  const applyRubricsFromCache = useCallback(() => {
    if (!courseCatalogId) {
      setRubricsBySkill({})
      return
    }
    const { rubricsBySkill: hydrated } = hydrateRubricsForItems(courseCatalogId, items)
    const withGeneric = { ...hydrated }
    for (const item of items) {
      if (!withGeneric[item.skillName]) {
        withGeneric[item.skillName] = buildGenericSkillRubric(item.skillName, item.category)
      }
    }
    setRubricsBySkill(withGeneric)
  }, [courseCatalogId, items])

  useEffect(() => {
    if (!courseCatalogId) return
    applyRubricsFromCache()
  }, [presetSignature, fullSignature, courseCatalogId, applyRubricsFromCache])

  const mergeRubric = useCallback((skillName, rubric) => {
    if (!rubric) return
    setRubricsBySkill((prev) => ({ ...prev, [skillName]: rubric }))
  }, [])

  const fetchRubricForSkill = useCallback(
    async (skillName, category) => {
      const cat = category === 'SOFT' ? 'SOFT' : 'TECHNICAL'
      const generic = buildGenericSkillRubric(skillName, cat)
      if (!openRouterEnabled || !courseCatalogId) return generic
      const cached = readCachedRubric(courseCatalogId, cat, skillName)
      if (cached) return cached
      const token = await getAccessToken()
      if (!token) return generic
      try {
        const rubric = await fetchSingleSkillRubric({
          token,
          courseCatalogId,
          courseLabel: courseLabel || courseCatalogId,
          skillName,
          category: cat,
        })
        if (rubric) {
          writeCachedRubric(courseCatalogId, cat, skillName, rubric)
          return rubric
        }
      } catch {
        /* use generic */
      }
      return generic
    },
    [openRouterEnabled, courseCatalogId, courseLabel, getAccessToken]
  )

  const enabled = openRouterEnabled

  return {
    rubricsBySkill,
    loading,
    enabled,
    mergeRubric,
    fetchRubricForSkill,
    courseCatalogId,
    courseLabel,
  }
}
