import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SkillsAnalysisMethodology from '@/components/skills/SkillsAnalysisMethodology'
import { EMPTY_FIELD } from '@/constants/copyStyle'

const STATUS_VARIANT = {
  met: 'accent',
  upskill: 'outline',
  gap: 'outline',
}

const STATUS_LABEL = {
  upskill: 'Upskill',
  gap: 'Gap',
}

function SkillStatusBadge({ status }) {
  if (status === 'met') {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-600"
        aria-label="Met"
        title="Met"
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
    )
  }
  return (
    <Badge variant={STATUS_VARIANT[status] ?? 'outline'} className="text-[10px]">
      {STATUS_LABEL[status] ?? status}
    </Badge>
  )
}

export default function SkillsAnalysisInterestPanel({ report }) {
  if (!report) return null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted mb-1">Industry benchmark role</p>
        <p className="font-medium text-ink">
          {report.pathwayRole?.title ?? report.targetRole ?? EMPTY_FIELD}
          {report.pathwayRole?.level && (
            <span className="text-muted font-normal"> · {report.pathwayRole.level}</span>
          )}
        </p>
        {report.skillsSource === 'web_agent' && (
          <p className="text-[11px] text-accent mt-1 font-mono uppercase tracking-wider">
            Requirements sourced via web research + analysis agent
          </p>
        )}
        <p className="text-xs text-muted mt-1">
          Required proficiency: {report.requiredLevelLabel ?? 'Intermediate'}
        </p>
      </div>

      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">
          How this analysis works
        </p>
        <SkillsAnalysisMethodology methodology={report.methodology} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-muted">
              <th className="py-2 pr-2 font-medium">Skill</th>
              <th className="py-2 pr-2 font-medium">Yours</th>
              <th className="py-2 pr-2 font-medium">Required</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(report.skills ?? []).map((row) => (
              <tr key={row.skillId ?? row.name} className="border-b border-hairline/60">
                <td className="py-2 pr-2 text-ink">{row.name}</td>
                <td className="py-2 pr-2 text-muted">{row.currentLevelLabel}</td>
                <td className="py-2 pr-2 text-muted">{row.requiredLevelLabel}</td>
                <td className="py-2">
                  <SkillStatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(report.gaps?.length > 0 || report.upskills?.length > 0) && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <p className="font-medium text-sm text-ink">Development plan</p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/career-pathway">View your pathway</Link>
            </Button>
          </div>
          <p className="text-xs text-muted mb-2">Start with items that need the most time.</p>
          <ul className="list-disc pl-5 text-sm text-muted space-y-1.5">
            {(report.prioritisedPlan ?? []).map((step) => (
              <li key={`${step.order}-${step.skill}`}>
                <span className="text-ink">{step.action || step.skill}</span>
                {step.estimatedTimeLabel && (
                  <span className="text-muted"> · {step.estimatedTimeLabel}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}
