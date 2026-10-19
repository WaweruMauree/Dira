import { useEffect } from 'react'
import { useStudentAppData } from '@/context/StudentAppDataProvider'

export function useJobHistory() {
  const { jobHistory: cache } = useStudentAppData()

  useEffect(() => {
    cache.ensure()
  }, [cache.ensure])

  const loading = cache.loading && cache.views.length === 0

  return { views: cache.views, loading, error: cache.error, refresh: cache.refresh }
}
