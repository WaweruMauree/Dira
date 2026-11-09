import { Label } from '@/components/ui/label'
import { EMPTY_FIELD } from '@/constants/copyStyle'
import { formatDisplayDate } from '@/lib/pathway/planDates'

function FieldBlock({ label, value, multiline = false }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted text-xs uppercase tracking-wider font-mono">{label}</Label>
      {multiline ? (
        <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{value || EMPTY_FIELD}</p>
      ) : (
        <p className="text-sm text-ink font-medium">{value || EMPTY_FIELD}</p>
      )}
    </div>
  )
}

export default function PathwayPlanView({ step }) {
  if (!step) return null

  const duration =
    step.suggestedDurationWeeks != null
      ? `${step.suggestedDurationWeeks} week${step.suggestedDurationWeeks === 1 ? '' : 's'}`
      : ''
  const start = formatDisplayDate(step.startDate)
  const end = formatDisplayDate(step.endDate)

  return (
    <div className="space-y-4 rounded-lg border border-hairline bg-secondary/20 p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FieldBlock label="Duration (weeks)" value={duration} />
        <FieldBlock label="Start date" value={start} />
        <FieldBlock label="End date" value={end} />
      </div>
      <FieldBlock label="Upskilling plan" value={step.upskillActions} multiline />
      <FieldBlock label="Completion KPI" value={step.completionKpi} />
    </div>
  )
}
