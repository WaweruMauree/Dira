import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'
import { isSupabaseConfigured } from '@/lib/env'
import {
  hydrateRubricsForItems,
  readCachedRubric,
  readCachedOpenRouterHealth,
  writeCachedOpenRouterHealth,
  writeCachedRubric,
} from '@/lib/skills/rubricCache'
import { fetchSingleSkillRubric } from '@/lib/skills/fetchSingleSkillRubric'

const CUSTOM_SKILL_DEBOUNCE_MS = 150

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
  const { getAccessToken, isConfigured } = useAuth()
  const [rubricsBySkill, setRubricsBySkill] = useState({})
  const [loading, setLoading] = useState(false)
  const [openRouterEnabled, setOpenRouterEnabled] = useState(() => readCachedOpenRouterHealth() ?? false)
  const debounceRef = useRef(null)
  const requestIdRef = useRef(0)
  const courseCatalogIdRef = useRef(courseCatalogId)

  useEffect(() => {
    courseCatalogIdRef.current = courseCatalogId
  }, [courseCatalogId])

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
      return { missingItems: [] }
    }
    const { rubricsBySkill: hydrated, missingItems } = hydrateRubricsForItems(courseCatalogId, items)
    setRubricsBySkill(hydrated)
    return { missingItems }
  }, [courseCatalogId, items])

  const fetchMissingRubrics = useCallback(
    async (missingItems, requestCourseId) => {
      if (!openRouterEnabled || !requestCourseId || missingItems.length === 0) return
      if (!isSupabaseConfigured() || !isConfigured) return

      const requestId = ++requestIdRef.current
      setLoading(true)
      try {
        const token = await getAccessToken()
        if (!token || requestId !== requestIdRef.current) return

        const { rubrics } = await diraApi.fetchSkillProficiencyRubrics(token, {
          courseCatalogId: requestCourseId,
          courseLabel: courseLabel || requestCourseId,
          items: missingItems,
        })

        if (requestId !== requestIdRef.current || courseCatalogIdRef.current !== requestCourseId) return

        const updates = {}
        for (const [name, rubric] of Object.entries(rubrics ?? {})) {
          updates[name] = rubric
          const cat = rubric.category === 'SOFT' ? 'SOFT' : 'TECHNICAL'
          writeCachedRubric(requestCourseId, cat, name, rubric)
        }
        if (Object.keys(updates).length > 0) {
          setRubricsBySkill((prev) => {
            if (courseCatalogIdRef.current !== requestCourseId) return prev
            return { ...prev, ...updates }
          })
        }
      } catch {
        /* hover may use lazy single-skill fetch */
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    },
    [openRouterEnabled, courseLabel, getAccessToken, isConfigured]
  )

  const runFetchForCurrentItems = useCallback(() => {
    const { missingItems } = applyRubricsFromCache()
    void fetchMissingRubrics(missingItems, courseCatalogId)
  }, [applyRubricsFromCache, fetchMissingRubrics, courseCatalogId])

  useEffect(() => {
    if (!openRouterEnabled || !courseCatalogId) return
    runFetchForCurrentItems()
  }, [presetSignature, openRouterEnabled, courseCatalogId, runFetchForCurrentItems])

  useEffect(() => {
    if (!openRouterEnabled || !courseCatalogId) return
    if (fullSignature === presetSignature) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const { missingItems } = hydrateRubricsForItems(courseCatalogId, items)
      setRubricsBySkill((prev) => {
        const next = { ...prev }
        for (const item of items) {
          const hit = readCachedRubric(courseCatalogId, item.category, item.skillName)
          if (hit) next[item.skillName] = hit
        }
        return next
      })
      void fetchMissingRubrics(missingItems, courseCatalogId)
    }, CUSTOM_SKILL_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fullSignature, presetSignature, openRouterEnabled, courseCatalogId, items, fetchMissingRubrics])

  const mergeRubric = useCallback((skillName, rubric) => {
    if (!rubric) return
    setRubricsBySkill((prev) => ({ ...prev, [skillName]: rubric }))
  }, [])

  const fetchRubricForSkill = useCallback(
    async (skillName, category) => {
      if (!openRouterEnabled || !courseCatalogId) return null
      const token = await getAccessToken()
      if (!token) return null
      return fetchSingleSkillRubric({
        token,
        courseCatalogId,
        courseLabel: courseLabel || courseCatalogId,
        skillName,
        category,
      })
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
