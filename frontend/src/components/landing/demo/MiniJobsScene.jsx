import { Briefcase, History } from 'lucide-react'
import { LANDING_DEMO_ROLES } from '@/components/landing/landingDemoData'

function StatusDot({ color }) {
  return <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />
}

export default function MiniJobsScene() {
  const rows = LANDING_DEMO_ROLES.slice(0, 3)

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/20 px-2 py-1 text-[10px] font-medium text-ink">
          <Briefcase className="h-3 w-3" />
          Matched roles
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-[10px] font-medium text-muted">
          <History className="h-3 w-3" />
          History
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-hidden">
        {rows.map((role) => (
          <div
            key={role.id}
            className="rounded-lg border border-hairline/60 bg-card-bg px-3 py-2 shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-ink">{role.title}</p>
                <p className="font-mono text-[9px] text-muted">{role.id}</p>
              </div>
              <p className="shrink-0 text-[11px] font-medium text-ink">{role.match}%</p>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <StatusDot color={role.statusColor} />
              <span className="text-[10px] text-muted">{role.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
