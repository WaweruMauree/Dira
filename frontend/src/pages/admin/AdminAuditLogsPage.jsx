import { useCallback } from 'react'
import { useAdminSession } from '@/hooks/useAdminSession'
import { diraApi } from '@/lib/api/dira'
import { useAdminPoll } from '@/hooks/useAdminPoll'

export default function AdminAuditLogsPage() {
  const { getAccessToken } = useAdminSession()

  const load = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    const res = await diraApi.adminListAuditLogs(token, { limit: 100 })
    return res.data
  }, [getAccessToken])

  const { data, loading, error } = useAdminPoll(load)

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="font-heading text-2xl font-medium text-ink">Audit access logs</h1>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="rounded-xl border border-hairline overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-secondary/30 text-left text-xs text-muted">
              <th className="p-3 font-medium">Time</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Target</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data?.length ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : (data ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted">
                  No audit logs yet.
                </td>
              </tr>
            ) : (
              data.map((log) => (
                <tr key={log.log_id} className="border-b border-hairline/60">
                  <td className="p-3 text-muted whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 text-ink">{log.action}</td>
                  <td className="p-3 text-muted">
                    {log.target_entity || '-'}
                    {log.target_id != null ? ` #${log.target_id}` : ''}
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
