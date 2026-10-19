import { useCallback, useEffect } from 'react'
import { diraApi } from '@/lib/api/dira'
import { useAuth } from '@/context/AuthProvider'
import { useStudentAppData } from '@/context/StudentAppDataProvider'

export function useJobFeed() {
  const { getAccessToken } = useAuth()
  const { jobs: jobsCache } = useStudentAppData()

  useEffect(() => {
    jobsCache.bootstrap()
  }, [jobsCache.bootstrap])

  const toggleSaved = useCallback(
    async (jobId, saved) => {
      const token = await getAccessToken()
      if (!token) return
      await diraApi.patchUserJob(token, jobId, { saved })
      jobsCache.setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, saved } : j)))
    },
    [getAccessToken, jobsCache]
  )

  const recordApply = useCallback(
    async (job) => {
      if (!job?.id || !job?.url) return
      try {
        const token = await getAccessToken()
        if (token) await diraApi.recordJobView(token, job.id)
      } catch {
        /* non-blocking */
      }
      window.open(job.url, '_blank', 'noopener,noreferrer')
    },
    [getAccessToken]
  )

  const loading = jobsCache.loading && jobsCache.jobs.length === 0

  return {
    jobs: jobsCache.jobs,
    filteredJobs: jobsCache.filteredJobs,
    locationOptions: jobsCache.locationOptions,
    filters: jobsCache.filters,
    setFilters: jobsCache.setFilters,
    loading,
    syncing: jobsCache.syncing,
    error: jobsCache.error,
    refresh: jobsCache.refresh,
    recommend: jobsCache.recommend,
    toggleSaved,
    recordApply,
  }
}
