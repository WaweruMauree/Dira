import { Button } from '@/components/ui/button'
import PathwayPlanSection from '@/components/pathway/PathwayPlanSection'
import PathwayStepResources from '@/components/pathway/PathwayStepResources'

export default function PathwayStepPanel({
  step,
  onSetStatus,
  onViewResources,
  onSavePlan,
  planSaving = false,
  gapReport = null,
  targetRole = '',
  showResources = false,
}) {
  if (!step) {
    return (
      <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-sm text-muted">
        Select a step on the timeline to view details.
      </div>
    )
  }

  const duration =
    step.suggestedDurationWeeks != null ? `${step.suggestedDurationWeeks} weeks (suggested)` : null

  return (
    <div className="rounded-xl border border-hairline bg-card-bg p-6 shadow-card space-y-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
          Step {step.order}
        </p>
        <h2 className="font-heading text-xl font-medium text-ink">{step.title}</h2>
        {step.description && <p className="text-sm text-muted mt-2">{step.description}</p>}
        {duration && <p className="text-xs text-muted mt-2">Estimated time: {duration}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {step.status !== 'in_progress' && step.status !== 'complete' && (
          <Button type="button" size="sm" onClick={() => onSetStatus(step.id, 'in_progress')}>
            Mark step in progress
          </Button>
        )}
        {step.status !== 'complete' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSetStatus(step.id, 'complete')}
          >
            Mark complete
          </Button>
        )}
        {step.status === 'complete' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSetStatus(step.id, 'not_started')}
          >
            Reset step
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={() => onViewResources(step.skillName)}>
          View linked resources
        </Button>
      </div>

      <PathwayPlanSection step={step} onSavePlan={onSavePlan} saving={planSaving} />

      {showResources && (
        <PathwayStepResources step={step} gapReport={gapReport} targetRole={targetRole} />
      )}
    </div>
  )
}
