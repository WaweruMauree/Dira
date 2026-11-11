import LandingFlowDemo from '@/components/landing/LandingFlowDemo'
import { LANDING_DEMO_STATS } from '@/components/landing/landingDemoData'

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
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ProductCard() {
  const { skillsMatch, interviewReadiness, appliedRoles, sparkline } = LANDING_DEMO_STATS

  return (
    <div className="mx-auto max-w-[560px] px-4 pb-16">
      <div className="overflow-hidden rounded-xl border border-hairline/50 bg-card-bg shadow-card">
        <div className="flex items-center justify-between border-b border-hairline/60 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect x="1" y="9" width="3" height="6" rx="0.5" fill="#17161a" />
              <rect x="6" y="5" width="3" height="10" rx="0.5" fill="#17161a" />
              <rect x="11" y="2" width="3" height="13" rx="0.5" fill="#17161a" />
            </svg>
            <span className="text-sm font-medium text-ink">Dira workspace</span>
          </div>
          <span className="rounded bg-gray-100 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
            this_semester
          </span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-hairline/60">
          <div className="px-4 py-4 text-center">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">Skills Match</p>
            <p className="text-2xl font-medium text-ink">{skillsMatch}%</p>
          </div>
          <div className="bg-accent/15 px-4 py-4 text-center">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
              Interview Readiness
            </p>
            <p className="text-2xl font-medium text-ink">{interviewReadiness}%</p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">Applied Roles</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl font-medium text-ink">{appliedRoles}</p>
              <Sparkline data={sparkline} width={48} height={18} />
            </div>
          </div>
        </div>

        <LandingFlowDemo />
      </div>
    </div>
  )
}
