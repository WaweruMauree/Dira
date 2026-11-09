import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { diraApi } from '@/lib/api/dira'
import { useAuth } from '@/context/AuthProvider'
import { interestsFromMe } from '@/lib/profile/careerInterests'
import { DEFAULT_JOB_FEED_FILTERS, collectLocationOptions, filterJobs } from '@/lib/jobs/filterJobs'
import { AgentApiError } from '@/lib/api/client'

const SAVE_DEBOUNCE_MS = 500
const PATHWAY_PREFETCH_CONCURRENCY = 2

function pathwayDevLog(label, interest, extra) {
  if (import.meta.env.DEV) {
    console.debug(`[pathway] ${label}`, interest, extra ?? '')
  }
}

async function runWithConcurrency(items, limit, fn) {
  if (!items.length) return
  const queue = [...items]
  const workerCount = Math.min(limit, queue.length)
  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length) {
      const item = queue.shift()
      if (item !== undefined) await fn(item)
    }
  })
  await Promise.all(workers)
}

export const OPENROUTER_SETUP_HINT =
  'Add OPENROUTER_API_KEY to backend/.env (not VITE_*), then restart the backend (npm run dev).'

function withOpenRouterHint(message) {
  if (!message || !/OPENROUTER_API_KEY/i.test(message)) return message
  return `${message} ${OPENROUTER_SETUP_HINT}`
}

function isMissingHistoryTable(err) {
  if (err instanceof AgentApiError) {
    if (err.status === 503) return true
    const msg = String(err.message ?? '')
    if (/required table is missing/i.test(msg)) return true
    const body = err.body
    if (body && typeof body === 'object' && 'code' in body && body.code === 'PGRST205') return true
  }
  if (err instanceof Error && /required table is missing/i.test(err.message)) return true
  return false
}

const StudentAppDataContext = createContext(null)

export function useStudentAppData() {
  const ctx = useContext(StudentAppDataContext)
  if (!ctx) {
    throw new Error('useStudentAppData must be used within StudentAppDataProvider')
  }
  return ctx
}

export function StudentAppDataProvider({ children }) {
  const { getAccessToken, user } = useAuth()

  const [skillsInterests, setSkillsInterests] = useState([])
  const [reportsByInterest, setReportsByInterest] = useState({})
  const [interestErrors, setInterestErrors] = useState({})
  const [skillsLoadingByInterest, setSkillsLoadingByInterest] = useState({})
  const [skillsActiveInterest, setSkillsActiveInterest] = useState('')
  const [skillsError, setSkillsError] = useState(null)
  const [openRouterReady, setOpenRouterReady] = useState(null)
  const [skillsInterestsLoaded, setSkillsInterestsLoaded] = useState(false)
  const hydratedInterestsRef = useRef(new Set())

  const [pathwaysByInterest, setPathwaysByInterest] = useState({})
  const [pathwayLoadingByInterest, setPathwayLoadingByInterest] = useState({})
  const [pathwayActiveInterest, setPathwayActiveInterest] = useState('')
  const [pathwayError, setPathwayError] = useState(null)
  const [pathwaySaveError, setPathwaySaveError] = useState(null)
  const [pathwayPlanSaving, setPathwayPlanSaving] = useState(false)
  const [selectedStepByInterest, setSelectedStepByInterest] = useState({})
  const pathwayHydratedRef = useRef(new Set())
  const pathwayInFlightRef = useRef(new Map())
  const pathwaysByInterestRef = useRef({})
  const reportsByInterestRef = useRef({})
  const pathwaysPrefetchedRef = useRef(false)
  const saveTimerRef = useRef(null)
  const pendingStepsRef = useRef(null)
  const pendingPathwayRef = useRef({ interest: null, pathwayId: null })

  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsSyncing, setJobsSyncing] = useState(false)
  const [jobsError, setJobsError] = useState(null)
  const [jobFilters, setJobFilters] = useState(DEFAULT_JOB_FEED_FILTERS)
  const jobsBootstrappedRef = useRef(false)

  const [savedJobs, setSavedJobs] = useState([])
  const [savedJobsLoading, setSavedJobsLoading] = useState(false)
  const [savedJobsError, setSavedJobsError] = useState(null)
  const savedJobsLoadedRef = useRef(false)

  const [jobHistoryViews, setJobHistoryViews] = useState([])
  const [jobHistoryLoading, setJobHistoryLoading] = useState(false)
  const [jobHistoryError, setJobHistoryError] = useState(null)
  const jobHistoryLoadedRef = useRef(false)

  const [cachedMe, setCachedMe] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)

  const [recentChats, setRecentChats] = useState([])
  const chatsLoadedRef = useRef(false)

  const clearAllCaches = useCallback(() => {
    hydratedInterestsRef.current = new Set()
    pathwayHydratedRef.current = new Set()
    jobsBootstrappedRef.current = false
    savedJobsLoadedRef.current = false
    jobHistoryLoadedRef.current = false
    chatsLoadedRef.current = false
    setSkillsInterests([])
    setReportsByInterest({})
    setInterestErrors({})
    setSkillsLoadingByInterest({})
    setSkillsActiveInterest('')
    setSkillsError(null)
    setSkillsInterestsLoaded(false)
    setPathwaysByInterest({})
    setPathwayLoadingByInterest({})
    setPathwayActiveInterest('')
    setPathwayError(null)
    setPathwaySaveError(null)
    setSelectedStepByInterest({})
    setJobs([])
    setJobsLoading(false)
    setJobsSyncing(false)
    setJobsError(null)
    setJobFilters(DEFAULT_JOB_FEED_FILTERS)
    setSavedJobs([])
    setSavedJobsLoading(false)
    setSavedJobsError(null)
    setJobHistoryViews([])
    setJobHistoryLoading(false)
    setJobHistoryError(null)
    setCachedMe(null)
    setProfileLoading(false)
    setProfileError(null)
    setRecentChats([])
    pathwaysPrefetchedRef.current = false
    pathwayInFlightRef.current = new Map()
  }, [])

  useEffect(() => {
    pathwaysByInterestRef.current = pathwaysByInterest
  }, [pathwaysByInterest])

  useEffect(() => {
    reportsByInterestRef.current = reportsByInterest
  }, [reportsByInterest])

  useEffect(() => {
    if (!user) clearAllCaches()
  }, [user, clearAllCaches])

  useEffect(() => {
    let cancelled = false
    diraApi
      .getHealth()
      .then((res) => {
        if (!cancelled) setOpenRouterReady(res.features?.openRouter === true)
      })
      .catch(() => {
        if (!cancelled) setOpenRouterReady(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadReportForInterest = useCallback(
    async (token, interest, { forceAnalyze = false } = {}) => {
      setSkillsLoadingByInterest((prev) => ({ ...prev, [interest]: true }))
      setInterestErrors((prev) => {
        const next = { ...prev }
        delete next[interest]
        return next
      })
      try {
        if (!forceAnalyze) {
          const latest = await diraApi.getLatestSkillsAnalysis(token, interest)
          if (latest.data) {
            const row = { ...latest.data, methodology: latest.data.methodology }
            setReportsByInterest((prev) => {
              const next = { ...prev, [interest]: row }
              reportsByInterestRef.current = next
              return next
            })
            return
          }
        }
        const analyzed = await diraApi.analyzeSkillsGap(token, { targetRole: interest })
        const row = { ...analyzed.data, methodology: analyzed.data.methodology }
        setReportsByInterest((prev) => {
          const next = { ...prev, [interest]: row }
          reportsByInterestRef.current = next
          return next
        })
      } catch (err) {
        const raw = err instanceof Error ? err.message : 'Analysis failed for this interest'
        setInterestErrors((prev) => ({ ...prev, [interest]: withOpenRouterHint(raw) }))
      } finally {
        hydratedInterestsRef.current.add(interest)
        setSkillsLoadingByInterest((prev) => ({ ...prev, [interest]: false }))
      }
    },
    []
  )

  const ensureSkillsReport = useCallback(
    async (interest) => {
      if (!interest) return
      if (hydratedInterestsRef.current.has(interest)) return
      const token = await getAccessToken()
      if (!token) return
      await loadReportForInterest(token, interest)
    },
    [getAccessToken, loadReportForInterest]
  )

  const bootstrapSkills = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) return
    setSkillsError(null)
    try {
      const { data: me } = await diraApi.me(token)
      setCachedMe((prev) => prev ?? me)
      const list = interestsFromMe(me)
      setSkillsInterests(list)
      setSkillsInterestsLoaded(true)
      if (list.length === 0) return
      const first = list[0]
      setSkillsActiveInterest((prev) => (prev && list.includes(prev) ? prev : first))
      setPathwayActiveInterest((prev) => (prev && list.includes(prev) ? prev : first))
      await loadReportForInterest(token, list[0])
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Could not load skills analysis'
      setSkillsError(withOpenRouterHint(raw))
      setSkillsInterestsLoaded(true)
    }
  }, [getAccessToken, loadReportForInterest])

  const skillsBootstrapRef = useRef(false)
  useEffect(() => {
    if (!user || skillsBootstrapRef.current) return
    skillsBootstrapRef.current = true
    bootstrapSkills()
  }, [user, bootstrapSkills])

  const setSkillsActiveInterestAndEnsure = useCallback(
    (interest) => {
      setSkillsActiveInterest(interest)
      ensureSkillsReport(interest)
    },
    [ensureSkillsReport]
  )

  const refreshSkillsAnalysis = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) return
    const list = skillsInterests.length
      ? skillsInterests
      : interestsFromMe((await diraApi.me(token)).data)
    if (!list.length) return
    setSkillsError(null)
    const target =
      skillsActiveInterest && list.includes(skillsActiveInterest) ? skillsActiveInterest : list[0]
    setInterestErrors((prev) => {
      const next = { ...prev }
      delete next[target]
      return next
    })
    await loadReportForInterest(token, target, { forceAnalyze: true })
  }, [getAccessToken, skillsInterests, skillsActiveInterest, loadReportForInterest])

  const runEnsurePathway = useCallback(
    async (interest) => {
      if (!interest) return
      if (pathwaysByInterestRef.current[interest]) {
        pathwayHydratedRef.current.add(interest)
        return
      }

      const token = await getAccessToken()
      if (!token) return

      setPathwayLoadingByInterest((prev) => ({ ...prev, [interest]: true }))
      setPathwayError(null)
      const t0 = import.meta.env.DEV ? performance.now() : 0

      try {
        pathwayDevLog('start', interest)
        await ensureSkillsReport(interest)

        let gapData = reportsByInterestRef.current[interest] ?? null
        if (!gapData) {
          pathwayDevLog('fetch-gap', interest)
          const latest = await diraApi.getLatestSkillsAnalysis(token, interest)
          gapData = latest.data
          if (gapData) {
            setReportsByInterest((prev) => ({ ...prev, [interest]: gapData }))
            reportsByInterestRef.current = { ...reportsByInterestRef.current, [interest]: gapData }
          }
        }

        if (!gapData) {
          pathwayDevLog('no-gap-report', interest)
          pathwayHydratedRef.current.add(interest)
          return
        }

        pathwayDevLog('fetch-current', interest)
        let current = await diraApi.getCurrentCareerPathway(token, interest)
        if (!current.data) {
          pathwayDevLog('generate', interest)
          current = await diraApi.generateCareerPathway(token, { targetRole: interest })
        }

        setPathwaysByInterest((prev) => {
          const next = { ...prev, [interest]: current.data }
          pathwaysByInterestRef.current = next
          return next
        })
        const firstStep = current.data?.roadmapData?.steps?.[0]
        setSelectedStepByInterest((prev) => ({
          ...prev,
          [interest]: prev[interest] ?? firstStep?.id ?? null,
        }))
        if (import.meta.env.DEV) {
          pathwayDevLog('done', interest, `${Math.round(performance.now() - t0)}ms`)
        }
      } catch (e) {
        setPathwayError(e?.message || 'Failed to load career pathway')
        pathwayDevLog('error', interest, e?.message)
      } finally {
        pathwayHydratedRef.current.add(interest)
        setPathwayLoadingByInterest((prev) => ({ ...prev, [interest]: false }))
      }
    },
    [getAccessToken, ensureSkillsReport]
  )

  const ensurePathway = useCallback(
    async (interest) => {
      if (!interest) return
      if (pathwaysByInterestRef.current[interest]) return

      const inFlight = pathwayInFlightRef.current.get(interest)
      if (inFlight) return inFlight

      const job = runEnsurePathway(interest).finally(() => {
        pathwayInFlightRef.current.delete(interest)
      })
      pathwayInFlightRef.current.set(interest, job)
      return job
    },
    [runEnsurePathway]
  )

  useEffect(() => {
    if (!skillsInterestsLoaded || skillsInterests.length === 0 || pathwaysPrefetchedRef.current) {
      return
    }
    pathwaysPrefetchedRef.current = true
    void runWithConcurrency(skillsInterests, PATHWAY_PREFETCH_CONCURRENCY, (interest) =>
      ensurePathway(interest)
    )
  }, [skillsInterestsLoaded, skillsInterests, ensurePathway])

  const clearPathwayPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    pendingStepsRef.current = null
    pendingPathwayRef.current = { interest: null, pathwayId: null }
    setPathwaySaveError(null)
  }, [])

  const setPathwayActiveInterestAndEnsure = useCallback(
    (interest) => {
      clearPathwayPendingSave()
      setPathwayActiveInterest(interest)
      ensurePathway(interest)
    },
    [clearPathwayPendingSave, ensurePathway]
  )

  const flushPathwaySave = useCallback(async () => {
    const token = await getAccessToken()
    const updates = pendingStepsRef.current
    const { interest, pathwayId } = pendingPathwayRef.current
    pendingStepsRef.current = null
    if (!token || !interest || !updates?.length) return
    const record = pathwaysByInterestRef.current[interest]
    const livePathwayId = record?.pathwayId ?? pathwayId
    if (!livePathwayId) return
    try {
      setPathwaySaveError(null)
      const { data } = await diraApi.patchCareerPathway(token, livePathwayId, { steps: updates })
      setPathwaysByInterest((prev) => ({ ...prev, [interest]: data }))
      pathwaysByInterestRef.current = { ...pathwaysByInterestRef.current, [interest]: data }
    } catch (e) {
      let msg = e?.message || 'Could not save step status'
      if (e instanceof AgentApiError && e.status === 404) {
        msg = 'Pathway was refreshed — select this role again and try again.'
      }
      setPathwaySaveError(msg)
    }
  }, [getAccessToken])

  const savePathwayPlanNow = useCallback(
    async (interest, stepId, fields) => {
      const token = await getAccessToken()
      if (!token) throw new Error('Not signed in')
      const record = pathwaysByInterestRef.current[interest]
      const pathwayId = record?.pathwayId
      if (!pathwayId) throw new Error('No pathway loaded for this role')

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      pendingStepsRef.current = null

      setPathwayPlanSaving(true)
      try {
        const stepPatch = { id: stepId, ...fields }
        const { data } = await diraApi.patchCareerPathway(token, pathwayId, { steps: [stepPatch] })
        setPathwaysByInterest((prev) => ({ ...prev, [interest]: data }))
        pathwaysByInterestRef.current = { ...pathwaysByInterestRef.current, [interest]: data }
        return data
      } catch (e) {
        let msg = e?.message || 'Could not save your plan'
        if (e instanceof AgentApiError && e.status === 404) {
          msg = 'Pathway was refreshed — select this role again and try Save plan.'
        } else if (/not found/i.test(msg)) {
          msg = 'Pathway was refreshed — select this role again and try Save plan.'
        }
        throw new Error(msg)
      } finally {
        setPathwayPlanSaving(false)
      }
    },
    [getAccessToken]
  )

  const schedulePathwayStepSave = useCallback(
    (interest, pathwayId, stepPatch) => {
      pendingPathwayRef.current = { interest, pathwayId }
      const existing = pendingStepsRef.current ?? []
      const idx = existing.findIndex((s) => s.id === stepPatch.id)
      if (idx >= 0) {
        existing[idx] = { ...existing[idx], ...stepPatch }
        pendingStepsRef.current = existing
      } else {
        pendingStepsRef.current = [...existing, stepPatch]
      }

      setPathwaysByInterest((prev) => {
        const record = prev[interest]
        if (!record?.roadmapData) return prev
        const nextSteps = record.roadmapData.steps.map((s) =>
          s.id === stepPatch.id ? { ...s, ...stepPatch } : s
        )
        const completed = nextSteps.filter((s) => s.status === 'complete').length
        const total = nextSteps.length
        return {
          ...prev,
          [interest]: {
            ...record,
            roadmapData: {
              ...record.roadmapData,
              steps: nextSteps,
              progressSummary: {
                completedSteps: completed,
                totalSteps: total,
                percent: total ? Math.round((completed / total) * 100) : 0,
              },
            },
          },
        }
      })

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(flushPathwaySave, SAVE_DEBOUNCE_MS)
    },
    [flushPathwaySave]
  )

  const regeneratePathwayForRole = useCallback(
    async (role) => {
      const token = await getAccessToken()
      const trimmed = role?.trim()
      if (!token || !trimmed) return
      clearPathwayPendingSave()
      setPathwayLoadingByInterest((prev) => ({ ...prev, [trimmed]: true }))
      setPathwayError(null)
      try {
        if (!reportsByInterestRef.current[trimmed]) {
          await loadReportForInterest(token, trimmed)
        }
        if (!reportsByInterestRef.current[trimmed]) {
          await loadReportForInterest(token, trimmed, { forceAnalyze: true })
        }
        const gapReport = reportsByInterestRef.current[trimmed]
        if (!gapReport) {
          setPathwayError(
            `Could not analyze skills for "${trimmed}". Check OpenRouter on the backend and try again.`
          )
          return
        }
        setReportsByInterest((prev) => ({ ...prev, [trimmed]: gapReport }))
        if (!skillsInterests.includes(trimmed)) {
          setSkillsInterests((prev) => [...prev, trimmed])
        }
        hydratedInterestsRef.current.add(trimmed)
        const generated = await diraApi.generateCareerPathway(token, { targetRole: trimmed })
        setPathwaysByInterest((prev) => ({ ...prev, [trimmed]: generated.data }))
        pathwaysByInterestRef.current = {
          ...pathwaysByInterestRef.current,
          [trimmed]: generated.data,
        }
        setPathwayActiveInterest(trimmed)
        const firstStep = generated.data?.roadmapData?.steps?.[0]
        setSelectedStepByInterest((prev) => ({ ...prev, [trimmed]: firstStep?.id ?? null }))
      } catch (e) {
        setPathwayError(e?.message || 'Could not generate pathway')
      } finally {
        setPathwayLoadingByInterest((prev) => ({ ...prev, [trimmed]: false }))
      }
    },
    [clearPathwayPendingSave, getAccessToken, loadReportForInterest, skillsInterests]
  )

  const loadJobFeed = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) return []
    const { data } = await diraApi.getJobFeed(token)
    setJobs(data ?? [])
    return data ?? []
  }, [getAccessToken])

  const bootstrapJobs = useCallback(async () => {
    if (jobsBootstrappedRef.current) return
    jobsBootstrappedRef.current = true
    setJobsLoading(true)
    setJobsError(null)
    try {
      const token = await getAccessToken()
      if (!token) return
      const existing = await diraApi.getJobFeed(token)
      setJobs(existing.data ?? [])
      if (!existing.data?.length) {
        setJobsSyncing(true)
        try {
          await diraApi.recommendJobs(token, false)
          await loadJobFeed()
        } catch (err) {
          setJobsError(err instanceof Error ? err.message : 'Failed to load jobs')
        } finally {
          setJobsSyncing(false)
        }
      }
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setJobsLoading(false)
    }
  }, [getAccessToken, loadJobFeed])

  const recommendJobs = useCallback(
    async (force = false) => {
      const token = await getAccessToken()
      if (!token) return
      setJobsSyncing(true)
      setJobsError(null)
      try {
        const { data } = await diraApi.recommendJobs(token, force)
        setJobs(data ?? [])
      } catch (err) {
        setJobsError(err instanceof Error ? err.message : 'Could not load jobs')
        await loadJobFeed()
      } finally {
        setJobsSyncing(false)
      }
    },
    [getAccessToken, loadJobFeed]
  )

  const refreshJobFeed = useCallback(async () => {
    setJobsLoading(true)
    try {
      await loadJobFeed()
    } finally {
      setJobsLoading(false)
    }
  }, [loadJobFeed])

  const loadSavedJobs = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setSavedJobs([])
      return
    }
    setSavedJobsLoading(true)
    setSavedJobsError(null)
    try {
      const { data } = await diraApi.listUserJobs(token, { saved: true, limit: 50 })
      setSavedJobs(data ?? [])
      savedJobsLoadedRef.current = true
    } catch (err) {
      setSavedJobsError(err instanceof Error ? err.message : 'Could not load saved jobs')
    } finally {
      setSavedJobsLoading(false)
    }
  }, [getAccessToken])

  const ensureSavedJobs = useCallback(async () => {
    if (savedJobsLoadedRef.current) return
    await loadSavedJobs()
  }, [loadSavedJobs])

  const loadJobHistory = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setJobHistoryViews([])
      return
    }
    setJobHistoryLoading(true)
    setJobHistoryError(null)
    try {
      const { data } = await diraApi.listJobViews(token)
      setJobHistoryViews(data ?? [])
      jobHistoryLoadedRef.current = true
    } catch (err) {
      if (isMissingHistoryTable(err)) {
        setJobHistoryViews([])
        setJobHistoryError(null)
      } else {
        setJobHistoryError(err instanceof Error ? err.message : 'Could not load history')
      }
    } finally {
      setJobHistoryLoading(false)
    }
  }, [getAccessToken])

  const ensureJobHistory = useCallback(async () => {
    if (jobHistoryLoadedRef.current) return
    await loadJobHistory()
  }, [loadJobHistory])

  const loadProfileMe = useCallback(
    async (force = false) => {
      if (cachedMe && !force) return cachedMe
      setProfileLoading(true)
      setProfileError(null)
      try {
        const token = await getAccessToken()
        if (!token) {
          setCachedMe(null)
          return null
        }
        const { data } = await diraApi.me(token)
        setCachedMe(data)
        return data
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : 'Failed to load profile')
        return null
      } finally {
        setProfileLoading(false)
      }
    },
    [cachedMe, getAccessToken]
  )

  const refreshRecentChats = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setRecentChats([])
      return
    }
    try {
      const { data } = await diraApi.listConversations(token)
      setRecentChats(
        (data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          mode: row.mode,
          updatedAt: row.updated_at,
          preview: row.preview ?? '',
        }))
      )
      chatsLoadedRef.current = true
    } catch {
      setRecentChats([])
    }
  }, [getAccessToken])

  const ensureRecentChats = useCallback(async () => {
    if (chatsLoadedRef.current) return
    await refreshRecentChats()
  }, [refreshRecentChats])

  const filteredJobs = useMemo(() => filterJobs(jobs, jobFilters), [jobs, jobFilters])
  const locationOptions = useMemo(() => collectLocationOptions(jobs), [jobs])

  const value = useMemo(
    () => ({
      skills: {
        interests: skillsInterests,
        reportsByInterest,
        interestErrors,
        loadingByInterest: skillsLoadingByInterest,
        activeInterest: skillsActiveInterest,
        setActiveInterest: setSkillsActiveInterestAndEnsure,
        error: skillsError,
        openRouterReady,
        interestsLoaded: skillsInterestsLoaded,
        refresh: refreshSkillsAnalysis,
        ensureReport: ensureSkillsReport,
      },
      pathway: {
        interests: skillsInterests,
        pathwaysByInterest,
        loadingByInterest: pathwayLoadingByInterest,
        activeInterest: pathwayActiveInterest,
        setActiveInterest: setPathwayActiveInterestAndEnsure,
        selectedStepByInterest,
        setSelectedStepId: (interest, stepId) =>
          setSelectedStepByInterest((prev) => ({ ...prev, [interest]: stepId })),
        error: pathwayError,
        saveError: pathwaySaveError,
        planSaving: pathwayPlanSaving,
        scheduleStepSave: schedulePathwayStepSave,
        savePlanNow: savePathwayPlanNow,
        regenerateForRole: regeneratePathwayForRole,
        ensurePathway,
        getGapReport: (interest) => reportsByInterest[interest] ?? null,
      },
      jobs: {
        jobs,
        filteredJobs,
        locationOptions,
        filters: jobFilters,
        setFilters: setJobFilters,
        loading: jobsLoading,
        syncing: jobsSyncing,
        error: jobsError,
        bootstrap: bootstrapJobs,
        refresh: refreshJobFeed,
        recommend: recommendJobs,
        loadFeed: loadJobFeed,
        setJobs,
      },
      savedJobs: {
        jobs: savedJobs,
        loading: savedJobsLoading,
        error: savedJobsError,
        ensure: ensureSavedJobs,
        refresh: loadSavedJobs,
        setJobs: setSavedJobs,
      },
      jobHistory: {
        views: jobHistoryViews,
        loading: jobHistoryLoading,
        error: jobHistoryError,
        ensure: ensureJobHistory,
        refresh: loadJobHistory,
      },
      profile: {
        me: cachedMe,
        loading: profileLoading,
        error: profileError,
        load: loadProfileMe,
        setMe: setCachedMe,
      },
      home: {
        chats: recentChats,
        ensureChats: ensureRecentChats,
        refreshChats: refreshRecentChats,
      },
    }),
    [
      skillsInterests,
      reportsByInterest,
      interestErrors,
      skillsLoadingByInterest,
      skillsActiveInterest,
      setSkillsActiveInterestAndEnsure,
      skillsError,
      openRouterReady,
      skillsInterestsLoaded,
      refreshSkillsAnalysis,
      ensureSkillsReport,
      pathwaysByInterest,
      pathwayLoadingByInterest,
      pathwayActiveInterest,
      setPathwayActiveInterestAndEnsure,
      selectedStepByInterest,
      pathwayError,
      pathwaySaveError,
      pathwayPlanSaving,
      schedulePathwayStepSave,
      savePathwayPlanNow,
      regeneratePathwayForRole,
      ensurePathway,
      jobs,
      filteredJobs,
      locationOptions,
      jobFilters,
      jobsLoading,
      jobsSyncing,
      jobsError,
      bootstrapJobs,
      refreshJobFeed,
      recommendJobs,
      loadJobFeed,
      savedJobs,
      savedJobsLoading,
      savedJobsError,
      ensureSavedJobs,
      loadSavedJobs,
      jobHistoryViews,
      jobHistoryLoading,
      jobHistoryError,
      ensureJobHistory,
      loadJobHistory,
      cachedMe,
      profileLoading,
      profileError,
      loadProfileMe,
      recentChats,
      ensureRecentChats,
      refreshRecentChats,
    ]
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  return (
    <StudentAppDataContext.Provider value={value}>{children}</StudentAppDataContext.Provider>
  )
}
