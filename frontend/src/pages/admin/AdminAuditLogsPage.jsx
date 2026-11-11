import { useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminSession } from '@/hooks/useAdminSession'
import { diraApi } from '@/lib/api/dira'
import { useAdminPoll } from '@/hooks/useAdminPoll'

function Metric({ label, value }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-heading font-medium text-ink">{value ?? '-'}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminAuditLogsPage() {
  const { getAccessToken } = useAdminSession()

  const loadUsage = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    const res = await diraApi.adminGetUsageReport(token)
    return res.data
  }, [getAccessToken])

  const loadLogs = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    const res = await diraApi.adminListAuditLogs(token, { limit: 100 })
    return res.data
  }, [getAccessToken])

  const {
    data: usageData,
    loading: usageLoading,
    error: usageError,
  } = useAdminPoll(loadUsage, { intervalMs: 30_000 })

  const {
    data: logsData,
    loading: logsLoading,
    error: logsError,
  } = useAdminPoll(loadLogs)

  return (
    <div className="space-y-10 max-w-6xl">
      <h1 className="font-heading text-2xl font-medium text-ink">Audit Logs</h1>

      <section className="space-y-4">
        <h2 className="font-medium text-ink">Usage reports</h2>
        <p className="text-sm text-muted">Platform activity totals (refreshes every 30 seconds).</p>
        {usageError && <p className="text-sm text-destructive">{usageError}</p>}
        {usageLoading && !usageData ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Metric label="Total students" value={usageData?.totalStudents} />
            <Metric label="Total conversations" value={usageData?.totalConversations} />
            <Metric label="Conversations (30 days)" value={usageData?.conversationsLast30Days} />
            <Metric label="Job records (user_jobs)" value={usageData?.totalUserJobs} />
            <Metric label="Skills analyses" value={usageData?.totalSkillsAnalyses} />
            <Metric label="Saved opportunities" value={usageData?.totalSavedOpportunities} />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-medium text-ink">Audit access logs</h2>
        {logsError && <p className="text-sm text-destructive">{logsError}</p>}
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
              {logsLoading && !logsData?.length ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : (logsData ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted">
                    No audit logs yet.
                  </td>
                </tr>
              ) : (
                logsData.map((log) => (
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
      </section>
    </div>
  )
}
