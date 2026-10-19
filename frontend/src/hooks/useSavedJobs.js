import { useCallback, useEffect } from 'react'
import { diraApi } from '@/lib/api/dira'
import { useAuth } from '@/context/AuthProvider'
import { useStudentAppData } from '@/context/StudentAppDataProvider'

export function useSavedJobs() {
  const { getAccessToken } = useAuth()
  const { savedJobs: cache } = useStudentAppData()

  useEffect(() => {
    cache.ensure()
  }, [cache.ensure])

  const refresh = useCallback(async () => {
    await cache.refresh()
  }, [cache])

  const toggleSaved = useCallback(
    async (jobId, saved) => {
      const token = await getAccessToken()
      if (!token) return
      await diraApi.patchUserJob(token, jobId, { saved })
      if (!saved) {
        cache.setJobs((prev) => prev.filter((j) => j.id !== jobId))
      } else {
        cache.setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, saved } : j)))
      }
    },
    [getAccessToken, cache]
  )

  const loading = cache.loading && cache.jobs.length === 0

  return { jobs: cache.jobs, loading, error: cache.error, refresh, toggleSaved }
}
