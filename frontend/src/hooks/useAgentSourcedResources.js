import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'

function reportHasAgentField(report) {
  return report != null && Array.isArray(report.agentSourcedResources)
}

function needsBackfill(report) {
  if (!report) return false
  if (reportHasAgentField(report)) return false
  if (report.agentSourcedResourcesMeta?.unavailable) return false
  const gaps = report.gaps?.length ?? 0
  const upskills = report.upskills?.length ?? 0
  return gaps + upskills > 0
}

/**
 * Lazy-fetch Exa learning links for reports saved before agentSourcedResources existed.
 */
export function useAgentSourcedResources(report, targetRole) {
  const { getAccessToken } = useAuth()
  const [groups, setGroups] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fetchedForRef = useRef(null)

  useEffect(() => {
    setError(null)

    if (!report || !targetRole) {
      setGroups([])
      setMeta(null)
      setLoading(false)
      return
    }

    if (reportHasAgentField(report)) {
      setGroups(report.agentSourcedResources)
      setMeta(report.agentSourcedResourcesMeta ?? null)
      setLoading(false)
      return
    }

    if (report.agentSourcedResourcesMeta?.unavailable) {
      setGroups([])
      setMeta(report.agentSourcedResourcesMeta)
      setLoading(false)
      return
    }

    if (!needsBackfill(report)) {
      setGroups([])
      setMeta(null)
      setLoading(false)
      return
    }

    const key = targetRole
    if (fetchedForRef.current === key) {
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const token = await getAccessToken()
        if (!token || cancelled) return
        const { data } = await diraApi.fetchSkillsGapAgentResources(token, {
          targetRole,
        })
        if (cancelled) return
        fetchedForRef.current = key
        setGroups(data.agentSourcedResources ?? [])
        setMeta(data.agentSourcedResourcesMeta ?? null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load recommendations')
          setGroups([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [report, targetRole, getAccessToken])

  if (reportHasAgentField(report)) {
    return {
      groups: report.agentSourcedResources,
      meta: report.agentSourcedResourcesMeta ?? null,
      loading: false,
      error: null,
    }
  }

  if (report?.agentSourcedResourcesMeta?.unavailable) {
    return {
      groups: [],
      meta: report.agentSourcedResourcesMeta,
      loading: false,
      error: null,
    }
  }

  return { groups, meta, loading, error }
}
