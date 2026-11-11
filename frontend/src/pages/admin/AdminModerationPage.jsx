import { useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAdminSession } from '@/hooks/useAdminSession'
import { diraApi } from '@/lib/api/dira'
import { useAdminPoll } from '@/hooks/useAdminPoll'

export default function AdminModerationPage() {
  const { getAccessToken } = useAdminSession()

  const load = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    const res = await diraApi.adminGetPendingReviews(token)
    return res.data
  }, [getAccessToken])

  const { data, loading, error, refresh } = useAdminPoll(load)

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
    <div className="space-y-6 max-w-6xl">
      <h1 className="font-heading text-2xl font-medium text-ink">Opportunity Moderation</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="rounded-xl border border-hairline overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-secondary/30 text-left text-xs text-muted">
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Source</th>
              <th className="p-3 font-medium">Type</th>
              <th className="p-3 font-medium">Flag reason</th>
              <th className="p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data?.length ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : (data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">
                  Nothing awaiting review.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={`${row.entityType}-${row.id}`} className="border-b border-hairline/60">
                  <td className="p-3 text-ink">{row.title}</td>
                  <td className="p-3 text-muted">{row.source}</td>
                  <td className="p-3 text-muted font-mono text-xs">{row.entityType}</td>
                  <td className="p-3 text-muted max-w-xs">{row.flagReason}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="accent" onClick={() => handleReview(row.entityType, row.id, true)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReview(row.entityType, row.id, false)}>
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
    </div>
  )
}
