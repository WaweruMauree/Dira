import { useCallback, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import AuthInlineNotice from '@/components/auth/AuthInlineNotice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminSession } from '@/hooks/useAdminSession'
import { diraApi } from '@/lib/api/dira'
import { useAdminPoll } from '@/hooks/useAdminPoll'
import { cn } from '@/lib/utils'

function Stat({ label, value, sub }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-heading font-medium text-ink">{value ?? '-'}</p>
        {sub ? <p className="text-xs text-muted mt-1">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}

const statusVariant = {
  healthy: 'default',
  degraded: 'secondary',
  down: 'destructive',
}

export default function AdminSystemPage() {
  const { getAccessToken } = useAdminSession()
  const [probing, setProbing] = useState(false)
  const [probeNotice, setProbeNotice] = useState(null)

  const loadHealth = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    const res = await diraApi.adminGetSystemHealth(token)
    return res.data
  }, [getAccessToken])

  const loadRuns = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) throw new Error('Not signed in')
    const res = await diraApi.adminGetSystemPerformance(token, { limit: 50 })
    return res.data
  }, [getAccessToken])

  const { data: health, loading: healthLoading, error: healthError } = useAdminPoll(loadHealth, {
    intervalMs: 30_000,
  })

  const { data: runs, loading: runsLoading, error: runsError, refresh: refreshRuns } = useAdminPoll(loadRuns)

  const handleRunProbe = async () => {
    setProbing(true)
    setProbeNotice(null)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Not signed in')
      const { data } = await diraApi.adminRunAggregationProbe(token)
      const ok = data.providers.filter((p) => p.status === 'SUCCESS').length
      setProbeNotice({
        variant: 'success',
        message: 'Aggregation check complete',
        detail: `Recorded ${data.runsRecorded} runs (${ok} succeeded).`,
      })
      await refreshRuns()
    } catch (err) {
      setProbeNotice({
        variant: 'error',
        message: 'Probe failed',
        detail: err instanceof Error ? err.message : 'Could not run aggregation check.',
      })
    } finally {
      setProbing(false)
    }
  }

  const overallStatus = health?.overall?.status ?? 'healthy'

  return (
    <div className="space-y-10 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-medium text-ink">System Performance</h1>
        <p className="text-sm text-muted mt-1">Database, AI agent activity, and job ingestion health.</p>
      </div>

      {healthError && <p className="text-sm text-destructive">{healthError}</p>}

      <section className="space-y-4">
        <h2 className="font-medium text-ink">Overall system health</h2>
        {healthLoading && !health ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <Card className="shadow-card border-hairline">
            <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <Badge
                variant={statusVariant[overallStatus] ?? 'outline'}
                className={cn(
                  'w-fit uppercase font-mono text-[10px] tracking-wider',
                  overallStatus === 'healthy' && 'bg-accent/20 text-ink border-accent/40'
                )}
              >
                {overallStatus}
              </Badge>
              <p className="text-sm text-muted flex-1">{health?.overall?.summary}</p>
              {health?.api?.time ? (
                <p className="text-xs text-muted whitespace-nowrap">
                  Checked {new Date(health.api.time).toLocaleString()}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-medium text-ink">Database</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat
            label="Connection"
            value={health?.database?.ok ? 'Connected' : 'Error'}
            sub={health?.database?.checkedAt
              ? `Last probe ${new Date(health.database.checkedAt).toLocaleTimeString()}`
              : null}
          />
          <Stat
            label="Query latency"
            value={
              health?.database?.latencyMs != null ? `${health.database.latencyMs} ms` : undefined
            }
          />
          <Stat
            label="Aggregation success (7d)"
            value={
              health?.jobAggregation?.successRatePercent != null
                ? `${health.jobAggregation.successRatePercent}%`
                : health?.jobAggregation?.runsLast7d === 0
                  ? 'No runs'
                  : undefined
            }
            sub={
              health?.jobAggregation
                ? `${health.jobAggregation.runsLast7d} runs, ${health.jobAggregation.failedLast7d} failed`
                : null
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-medium text-ink">AI agent</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Stat
            label="OpenRouter"
            value={health?.agent?.openRouterConfigured ? 'Configured' : 'Not configured'}
          />
          <Stat label="Exa search" value={health?.agent?.exaConfigured ? 'Configured' : 'Not configured'} />
          <Stat label="Conversations (24h)" value={health?.agent?.conversationsLast24h} />
          <Stat label="Messages (24h)" value={health?.agent?.messagesLast24h} />
          <Stat label="Skills analyses (7d)" value={health?.agent?.skillsAnalysesLast7d} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-medium text-ink">Job aggregation</h2>
            <p className="text-sm text-muted">Recent opportunity source aggregation runs.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={probing}
            onClick={handleRunProbe}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', probing && 'animate-spin')} />
            {probing ? 'Running check…' : 'Run check now'}
          </Button>
        </div>
        {probeNotice ? (
          <div className="flex justify-center">
            <button
              type="button"
              className="w-auto text-left"
              onClick={() => setProbeNotice(null)}
              aria-label="Dismiss message"
            >
              <AuthInlineNotice
                variant={probeNotice.variant}
                message={probeNotice.message}
                detail={probeNotice.detail}
                className="mx-0"
              />
            </button>
          </div>
        ) : null}
        {runsError && <p className="text-sm text-destructive">{runsError}</p>}
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
              {runsLoading && !runs?.length ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : (runs ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted">
                    No aggregation runs recorded yet.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
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
      </section>
    </div>
  )
}
