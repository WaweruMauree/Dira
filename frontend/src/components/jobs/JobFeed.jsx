import { Briefcase, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import JobCard from '@/components/jobs/JobCard'
import JobFeedFilters from '@/components/jobs/JobFeedFilters'

export default function JobFeed({
  jobs,
  allJobsCount,
  loading,
  syncing,
  error,
  filters,
  onFiltersChange,
  locationOptions,
  onRefresh,
  onRecommend,
  onToggleSaved,
  onApplyClick,
}) {
  const hasActiveFilters =
    (filters?.location ?? '').trim() ||
    (filters?.careerStages?.length ?? 0) > 0 ||
    (filters?.arrangements?.length ?? 0) > 0

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <h2 className="font-heading text-xl font-medium text-ink">Matched roles</h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          disabled={syncing || loading}
          onClick={() => onRecommend?.(true)}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <JobFeedFilters
        filters={filters}
        onChange={onFiltersChange}
        locationOptions={locationOptions}
      />

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
        {loading && (allJobsCount ?? jobs.length) === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-sm text-muted">
            Finding roles tailored to your profile…
          </div>
        ) : jobs.length === 0 && (allJobsCount ?? 0) > 0 && hasActiveFilters ? (
          <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-sm text-muted">
            No roles match your filters. Try clearing filters or adjusting location.
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-8 text-center">
            <Briefcase className="h-8 w-8 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted mb-3">No listings yet. Ask the assistant to search for roles.</p>
            <Button variant="accent" size="sm" onClick={() => onRecommend?.(true)}>
              Search now
            </Button>
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onToggleSaved={onToggleSaved}
              onApplyClick={onApplyClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
