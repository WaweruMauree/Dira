import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'
import { agentGroupForSkill } from '@/lib/skills/resourceFilters'

export function useStepAgentResources(report, targetRole, skillName) {
  const { getAccessToken } = useAuth()
  const [groups, setGroups] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fetchedForRef = useRef(null)

  useEffect(() => {
    setError(null)
    if (!skillName || !targetRole) {
      setGroups([])
      setMeta(null)
      return
    }

    const existing = report?.agentSourcedResources
    if (Array.isArray(existing)) {
      const match = agentGroupForSkill(existing, skillName)
      if (match) {
        setGroups([match])
        setMeta(report.agentSourcedResourcesMeta ?? null)
        setLoading(false)
        return
      }
    }

  const key = `${targetRole}::${skillName}`
    if (fetchedForRef.current === key) return

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const token = await getAccessToken()
        if (!token || cancelled) return
        const { data } = await diraApi.fetchSkillsGapAgentResources(token, {
          targetRole,
          skills: [skillName],
        })
        if (cancelled) return
        fetchedForRef.current = key
        const all = data.agentSourcedResources ?? []
        const match = agentGroupForSkill(all, skillName)
        setGroups(match ? [match] : all.filter((g) => g.skill?.includes(skillName))?.slice(0, 1))
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
  }, [report, targetRole, skillName, getAccessToken])

  return { groups, meta, loading, error }
}
