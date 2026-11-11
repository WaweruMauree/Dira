import { useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { useAdminSession } from '@/hooks/useAdminSession'
import { diraApi } from '@/lib/api/dira'
import { useAdminPoll } from '@/hooks/useAdminPoll'

export default function AdminSystemPage() {
  const { getAccessToken } = useAdminSession()

  const load = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    const res = await diraApi.adminGetSystemPerformance(token, { limit: 50 })
    return res.data
  }, [getAccessToken])

  const { data, loading, error } = useAdminPoll(load)

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="font-heading text-2xl font-medium text-ink">Monitor system performance</h1>
      <p className="text-sm text-muted">Recent job aggregation runs from opportunity sources.</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="rounded-xl border border-hairline overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-secondary/30 text-left text-xs text-muted">
              <th className="p-3 font-medium">Source</th>
              <th className="p-3 font-medium">Started</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Items</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data?.length ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : (data ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted">
                  No aggregation runs recorded yet.
                </td>
              </tr>
            ) : (
              data.map((run) => (
                <tr key={run.id} className="border-b border-hairline/60">
                  <td className="p-3 text-ink">
                    {run.opportunity_sources?.name ?? `Source #${run.id}`}
                  </td>
                  <td className="p-3 text-muted whitespace-nowrap">
                    {new Date(run.started_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{run.status}</Badge>
                  </td>
                  <td className="p-3 text-muted">{run.items_found}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
