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

export default function AdminUsageReportsPage() {
  const { getAccessToken } = useAdminSession()

  const load = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    const res = await diraApi.adminGetUsageReport(token)
    return res.data
  }, [getAccessToken])

  const { data, loading, error } = useAdminPoll(load, { intervalMs: 30_000 })

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="font-heading text-2xl font-medium text-ink">Generate usage reports</h1>
      <p className="text-sm text-muted">Platform activity totals (refreshes every 30 seconds).</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && !data ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Metric label="Total students" value={data?.totalStudents} />
          <Metric label="Total conversations" value={data?.totalConversations} />
          <Metric label="Conversations (30 days)" value={data?.conversationsLast30Days} />
          <Metric label="Job records (user_jobs)" value={data?.totalUserJobs} />
          <Metric label="Skills analyses" value={data?.totalSkillsAnalyses} />
          <Metric label="Saved opportunities" value={data?.totalSavedOpportunities} />
        </div>
      )}
    </div>
  )
}
