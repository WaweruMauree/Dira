import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Briefcase, History } from 'lucide-react'
import JobFeed from '@/components/jobs/JobFeed'
import JobHistoryPanel from '@/components/jobs/JobHistoryPanel'
import JobSearchChatPopup from '@/components/jobs/JobSearchChatPopup'
import { useJobFeed } from '@/hooks/useJobFeed'
import { useJobHistory } from '@/hooks/useJobHistory'

function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-accent/20 text-ink border border-accent/40'
          : 'text-muted hover:text-ink border border-transparent hover:border-hairline'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}

export default function JobSearchPage() {
  useParams()
  const [tab, setTab] = useState('matched')
  const {
    jobs,
    filteredJobs,
    locationOptions,
    filters,
    setFilters,
    loading,
    syncing,
    error,
    refresh,
    recommend,
    toggleSaved,
    recordApply,
  } = useJobFeed()
  const { refresh: refreshHistory } = useJobHistory()

  const handleApply = async (job) => {
    await recordApply(job)
    refreshHistory()
  }

  const handleToolComplete = (name) => {
    if (name === 'listJobs') {
      refresh()
    }
  }

  useEffect(() => {
    if (tab === 'history') refreshHistory()
  }, [tab, refreshHistory])

  return (
    <div className="h-[calc(100vh-0px)] md:h-screen min-h-0 p-4 md:p-6 overflow-hidden flex flex-col">
      <div className="flex gap-2 mb-4 shrink-0">
        <TabButton active={tab === 'matched'} onClick={() => setTab('matched')} icon={Briefcase}>
          Matched roles
        </TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={History}>
          History
        </TabButton>
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'matched' ? (
          <JobFeed
            jobs={filteredJobs}
            allJobsCount={jobs.length}
            locationOptions={locationOptions}
            loading={loading}
            syncing={syncing}
            error={error}
            filters={filters}
            onFiltersChange={setFilters}
            onRefresh={refresh}
            onRecommend={recommend}
            onToggleSaved={toggleSaved}
            onApplyClick={handleApply}
          />
        ) : (
          <div className="flex flex-col h-full min-h-0">
            <div className="mb-4 shrink-0">
              <h2 className="font-heading text-xl font-medium text-ink">History</h2>
              <p className="text-xs text-muted mt-1">Listings you opened from Apply.</p>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              <JobHistoryPanel />
            </div>
          </div>
        )}
      </div>

      <JobSearchChatPopup onToolComplete={handleToolComplete} />
    </div>
  )
}
