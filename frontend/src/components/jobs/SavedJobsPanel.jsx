import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import JobCard from '@/components/jobs/JobCard'
import { useSavedJobs } from '@/hooks/useSavedJobs'
import { diraApi } from '@/lib/api/dira'
import { useAuth } from '@/context/AuthProvider'

async function trackApply(getAccessToken, job) {
  if (!job?.id || !job?.url) return
  try {
    const token = await getAccessToken()
    if (token) await diraApi.recordJobView(token, job.id)
  } catch {
    /* non-blocking */
  }
  window.open(job.url, '_blank', 'noopener,noreferrer')
}

export default function SavedJobsPanel() {
  const { getAccessToken } = useAuth()
  const { jobs, loading, error, toggleSaved } = useSavedJobs()

  if (loading) {
    return <p className="text-sm text-muted text-center py-12">Loading saved roles…</p>
  }

  if (error) {
    return <p className="text-sm text-destructive text-center py-8">{error}</p>
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-card-bg/50 p-12 text-center">
        <Bookmark className="h-10 w-10 text-muted mx-auto mb-4" />
        <h2 className="font-heading text-xl font-medium text-ink mb-2">No saved jobs yet</h2>
        <p className="text-muted text-sm mb-6 max-w-md mx-auto">
          Save roles from Job Search to revisit them here.
        </p>
        <Button variant="accent" asChild>
          <Link to="/jobs">Browse jobs</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onToggleSaved={toggleSaved}
          onApplyClick={(j) => trackApply(getAccessToken, j)}
        />
      ))}
    </div>
  )
}
