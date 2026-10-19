import { cn } from '@/lib/utils'

const STATUS_RING = {
  complete: 'bg-accent border-accent text-white',
  in_progress: 'bg-accent/15 border-accent text-accent',
  not_started: 'bg-card-bg border-hairline text-muted',
}

const MAX_TIMELINE_STEPS = 6

export default function PathwayTimeline({
  steps,
  selectedStepId,
  onSelectStep,
  progressPercent = 0,
  totalSkillCount,
}) {
  if (!steps?.length) return null

  const displaySteps = steps.slice(0, MAX_TIMELINE_STEPS)
  const total = totalSkillCount ?? steps.length

  return (
    <div className="space-y-4">
      {total > MAX_TIMELINE_STEPS && (
        <p className="text-xs text-muted">
          Showing top {MAX_TIMELINE_STEPS} priorities · {total} skills in your plan
        </p>
      )}
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="relative flex items-start justify-between gap-2 overflow-x-auto pb-2">
        <div
          className="absolute left-4 right-4 top-5 h-px bg-hairline hidden sm:block"
          aria-hidden
        />
        {displaySteps.map((step) => {
          const active = step.id === selectedStepId
          const ring = STATUS_RING[step.status] ?? STATUS_RING.not_started
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={cn(
                'relative z-10 flex flex-col items-center min-w-[4.5rem] max-w-[7rem] shrink-0 text-center group',
                active && 'scale-105'
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-semibold transition-shadow',
                  ring,
                  active && 'ring-2 ring-accent/40 ring-offset-2 ring-offset-card-bg'
                )}
              >
                {step.order}
              </span>
              <span
                className={cn(
                  'mt-2 text-[11px] leading-tight line-clamp-2',
                  active ? 'text-ink font-medium' : 'text-muted group-hover:text-ink'
                )}
              >
                {step.skillName}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
