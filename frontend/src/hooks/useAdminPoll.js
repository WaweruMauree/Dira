import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_MS = 20_000

export function useAdminPoll(fetchFn, { intervalMs = DEFAULT_MS, enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchRef = useRef(fetchFn)
  fetchRef.current = fetchFn

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const result = await fetchRef.current()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    const run = async () => {
      if (cancelled) return
      await refresh()
    }
    run()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [enabled, intervalMs, refresh])

  return { data, loading, error, refresh }
}
