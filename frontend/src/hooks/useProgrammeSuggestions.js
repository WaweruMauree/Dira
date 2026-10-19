import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { diraApi } from '@/lib/api/dira'
import { isSupabaseConfigured } from '@/lib/env'
import {
  getCareerInterestsForCourse,
  getCourseDisplayLabel,
  getProfileKey,
  getSoftSkillsForCourse,
  getTechnicalSkillsForCourse,
  OTHER_COURSE_ID,
} from '@/constants/skills'
import {
  readCachedProgrammeSuggestions,
  writeCachedProgrammeSuggestions,
} from '@/lib/onboarding/programmeSuggestionsCache'

const DEBOUNCE_MS = 400

/**
 * @param {{
 *   form: { courseCatalogId: string, otherProgramme?: string }
 *   getAccessToken: () => Promise<string | null>
 *   isConfigured: boolean
 * }} params
 */
export function useProgrammeSuggestions({ form, getAccessToken, isConfigured }) {
  const profileKey = useMemo(() => getProfileKey(form), [form])
  const programmeLabel = useMemo(() => getCourseDisplayLabel(form), [form])
  const courseCatalogId = form.courseCatalogId || OTHER_COURSE_ID

  const staticLists = useMemo(
    () => ({
      technicalSkills: getTechnicalSkillsForCourse(profileKey),
      softSkills: getSoftSkillsForCourse(profileKey),
      careerInterests: getCareerInterestsForCourse(profileKey),
    }),
    [profileKey]
  )

  const [status, setStatus] = useState('idle')
  const [source, setSource] = useState('static')
  const [lists, setLists] = useState(staticLists)
  const [fetchError, setFetchError] = useState(false)
  const [features, setFeatures] = useState({ openRouter: false, exa: false })

  const requestIdRef = useRef(0)
  const debounceRef = useRef(null)

  const canFetch =
    Boolean(form.courseCatalogId) &&
    programmeLabel.trim().length >= 2 &&
    (form.courseCatalogId !== OTHER_COURSE_ID || (form.otherProgramme?.trim().length ?? 0) >= 2)

  useEffect(() => {
    let cancelled = false
    diraApi
      .getHealth()
      .then((h) => {
        if (!cancelled) {
          setFeatures({
            openRouter: Boolean(h.features?.openRouter),
            exa: Boolean(h.features?.exa),
          })
        }
      })
      .catch(() => {
        if (!cancelled) setFeatures({ openRouter: false, exa: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const applyLists = useCallback((next, nextSource) => {
    setLists(next)
    setSource(nextSource)
    setStatus('ready')
  }, [])

  useEffect(() => {
    if (!canFetch) {
      setStatus('idle')
      setSource('static')
      setLists(staticLists)
      setFetchError(false)
      return
    }

    const cached = readCachedProgrammeSuggestions(courseCatalogId, programmeLabel)
    if (cached?.technicalSkills?.length) {
      applyLists(
        {
          technicalSkills: cached.technicalSkills,
          softSkills: cached.softSkills,
          careerInterests: cached.careerInterests,
        },
        cached.source === 'ai' ? 'ai' : 'fallback'
      )
      setFetchError(false)
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const runFetch = async () => {
      const requestId = ++requestIdRef.current
      if (!cached?.technicalSkills?.length) {
        setStatus('loading')
      }
      setFetchError(false)

      const useApi = isSupabaseConfigured() && isConfigured
      if (!useApi) {
        applyLists(staticLists, 'static')
        return
      }

      try {
        const token = await getAccessToken()
        if (!token) {
          applyLists(staticLists, 'static')
          return
        }
        const { data } = await diraApi.fetchProgrammeSuggestions(token, {
          courseCatalogId,
          programmeLabel: programmeLabel.trim(),
        })
        if (requestId !== requestIdRef.current) return

        const payload = {
          technicalSkills: data.technicalSkills,
          softSkills: data.softSkills,
          careerInterests: data.careerInterests,
        }
        writeCachedProgrammeSuggestions(courseCatalogId, programmeLabel, {
          ...payload,
          programmeSector: data.programmeSector,
          source: data.source,
        })
        applyLists(payload, data.source === 'ai' ? 'ai' : 'fallback')
      } catch {
        if (requestId !== requestIdRef.current) return
        setFetchError(true)
        applyLists(staticLists, 'static')
      }
    }

    debounceRef.current = setTimeout(() => {
      void runFetch()
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [
    canFetch,
    courseCatalogId,
    programmeLabel,
    staticLists,
    applyLists,
    getAccessToken,
    isConfigured,
  ])

  const signature = useMemo(
    () =>
      `${courseCatalogId}|${programmeLabel.trim().toLowerCase()}|${lists.technicalSkills.join('\u0001')}|${lists.softSkills.join('\u0001')}|${lists.careerInterests.join('\u0001')}`,
    [courseCatalogId, programmeLabel, lists]
  )

  const suggestionsLoading = canFetch && status === 'loading'

  return {
    status,
    source,
    lists,
    signature,
    suggestionsLoading,
    fetchError,
    programmeLabel,
    features,
    canFetch,
  }
}
