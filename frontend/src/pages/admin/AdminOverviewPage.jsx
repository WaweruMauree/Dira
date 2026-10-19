import { useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'
import { useAdminPoll } from '@/hooks/useAdminPoll'

function StatCard({ title, value }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-heading font-medium text-ink">{value ?? '-'}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminOverviewPage() {
  const { getAccessToken } = useAuth()

  const loadAll = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    const [summary, reviews, logs] = await Promise.all([
      diraApi.adminGetDashboardSummary(token),
      diraApi.adminGetPendingReviews(token),
      diraApi.adminListAuditLogs(token, { limit: 5 }),
    ])
    return { summary: summary.data, reviews: reviews.data, logs: logs.data }
  }, [getAccessToken])

  const { data, loading, error, refresh } = useAdminPoll(loadAll)

  const handleReview = async (entityType, id, approve) => {
    try {
      const token = await getAccessToken()
      if (!token) return
      if (approve) await diraApi.adminApproveReview(token, entityType, id)
      else await diraApi.adminRejectReview(token, entityType, id)
      toast.success(approve ? 'Approved' : 'Rejected')
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-medium text-ink">Admin dashboard</h1>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refresh()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={data?.summary?.totalStudents} />
        <StatCard title="Pending Listings" value={data?.summary?.pendingListings} />
        <StatCard title="Flagged Items" value={data?.summary?.flaggedItems} />
        <StatCard title="Active Sessions" value={data?.summary?.activeSessions} />
      </div>

      <section>
        <h2 className="font-medium text-ink mb-3">Opportunity listings awaiting review</h2>
        <div className="rounded-xl border border-hairline overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline bg-secondary/30 text-left text-xs text-muted">
                <th className="p-3 font-medium">Title</th>
                <th className="p-3 font-medium">Source</th>
                <th className="p-3 font-medium">Flag reason</th>
                <th className="p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {(data?.reviews ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted text-sm">
                    No listings pending review.
                  </td>
                </tr>
              ) : (
                data.reviews.slice(0, 8).map((row) => (
                  <tr key={`${row.entityType}-${row.id}`} className="border-b border-hairline/60">
                    <td className="p-3 text-ink">{row.title}</td>
                    <td className="p-3 text-muted">{row.source}</td>
                    <td className="p-3 text-muted max-w-xs truncate">{row.flagReason}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => handleReview(row.entityType, row.id, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(row.entityType, row.id, false)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-medium text-ink mb-3">Recent audit log entries</h2>
        <ul className="list-disc pl-5 text-sm text-muted space-y-1">
          {(data?.logs ?? []).length === 0 ? (
            <li>No audit entries yet.</li>
          ) : (
            data.logs.map((log) => (
              <li key={log.log_id} className="text-ink/90">
                {log.action}
                {log.target_entity && (
                  <span className="text-muted">
                    {' '}
                    · {log.target_entity}
                    {log.target_id != null ? ` #${log.target_id}` : ''}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
