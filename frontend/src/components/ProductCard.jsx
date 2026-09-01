function Sparkline({ data, color = '#6b6a72', width = 60, height = 20 }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * height}`)
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatusDot({ color }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
}

const roles = [
  { id: 'JNR-4821', title: 'Data Analyst Intern', status: 'Matched', statusColor: 'bg-emerald-400', match: 92 },
  { id: 'JNR-4819', title: 'Junior PM — Fintech', status: 'Applied', statusColor: 'bg-blue-400', match: 87 },
  { id: 'JNR-4815', title: 'Backend Dev — Health', status: 'Shortlisted', statusColor: 'bg-amber-400', match: 84 },
  { id: 'JNR-4812', title: 'Research Assistant', status: 'Matched', statusColor: 'bg-emerald-400', match: 79 },
]

export default function ProductCard() {
  return (
    <div className="mx-auto max-w-[560px] px-4 pb-16">
      <div className="bg-card-bg rounded-xl shadow-card overflow-hidden border border-hairline/50">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline/60">
          <div className="flex items-center gap-2.5">
            {/* Bar-chart icon */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="9" width="3" height="6" rx="0.5" fill="#17161a" />
              <rect x="6" y="5" width="3" height="10" rx="0.5" fill="#17161a" />
              <rect x="11" y="2" width="3" height="13" rx="0.5" fill="#17161a" />
            </svg>
            <span className="text-ink text-sm font-medium">Career Profile</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted bg-gray-100 px-2 py-1 rounded">
            this_semester
          </span>
        </div>

        {/* Stat Tiles */}
        <div className="grid grid-cols-3 divide-x divide-hairline/60">
          {/* Skills Match */}
          <div className="px-4 py-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1.5">Skills Match</p>
            <p className="text-ink text-2xl font-medium">87%</p>
          </div>

          {/* Interview Readiness — highlighted */}
          <div className="px-4 py-4 text-center bg-accent/15">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1.5">Interview Readiness</p>
            <p className="text-ink text-2xl font-medium">72%</p>
          </div>

          {/* Applied Roles */}
          <div className="px-4 py-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1.5">Applied Roles</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-ink text-2xl font-medium">14</p>
              <Sparkline data={[3, 5, 4, 8, 7, 10, 12, 14]} width={48} height={18} />
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="border-t border-hairline/60">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_100px_70px] px-5 py-2.5 border-b border-hairline/40">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Role</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted text-center">Status</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted text-right">Match%</span>
          </div>

          {/* Table Rows */}
          {roles.map((role) => (
            <div
              key={role.id}
              className="grid grid-cols-[1fr_100px_70px] items-center px-5 py-3 border-b border-hairline/30 last:border-b-0 hover:bg-gray-50/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-ink text-sm font-normal truncate">{role.title}</p>
                <p className="font-mono text-[10px] text-muted mt-0.5">{role.id}</p>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <StatusDot color={role.statusColor} />
                <span className="text-muted text-xs">{role.status}</span>
              </div>
              <p className="text-ink text-sm font-medium text-right">{role.match}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
