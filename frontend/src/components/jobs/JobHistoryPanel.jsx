import { ExternalLink, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useJobHistory } from '@/hooks/useJobHistory'

const SOURCE_LABELS = {
  himalayas: 'Himalayas',
  jobicy: 'Jobicy',
  arbeitnow: 'Arbeitnow',
  adzuna: 'Adzuna',
  remotive: 'Remotive',
}

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function dedupeByUrl(views) {
  const seen = new Set()
  const out = []
  for (const row of views) {
    const key = String(row.url ?? row.id)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
}

export default function JobHistoryPanel() {
  const { views, loading, error } = useJobHistory()
  const rows = dedupeByUrl(views)

  if (loading) {
    return (
      <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-sm text-muted">
        Loading history…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-hairline p-8 text-center">
        <p className="text-sm text-muted">{error}</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline p-8 text-center">
        <History className="h-8 w-8 text-muted mx-auto mb-3" />
        <p className="text-sm text-ink font-medium">Oops, nothing to see here.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const sourceLabel = SOURCE_LABELS[row.source] ?? row.source ?? 'Listing'
        return (
          <li
            key={row.id}
            className="rounded-xl border border-hairline bg-card-bg p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink text-sm truncate">{row.title}</p>
              <p className="text-xs text-muted truncate">
                {row.organisation || 'Company confidential'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px]">
                  {sourceLabel}
                </Badge>
                <span className="text-[10px] text-muted font-mono uppercase tracking-wider">
                  Viewed {formatRelativeTime(row.viewed_at)}
                </span>
              </div>
            </div>
            {row.url && (
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0" asChild>
                <a href={row.url} target="_blank" rel="noopener noreferrer">
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
