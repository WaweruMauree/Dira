import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function PathwayPlanEditor({ step, onChange, saveError }) {
  if (!step) return null

  const emit = (fields) => onChange(step.id, fields)

  return (
    <div className="space-y-4 rounded-lg border border-hairline bg-secondary/20 p-4">
      <p className="font-medium text-sm text-ink">Plan adjustment</p>
      {saveError && (
        <p className="text-xs text-destructive" role="alert">
          {saveError}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`duration-${step.id}`} className="text-xs">
            Duration (weeks)
          </Label>
          <Input
            id={`duration-${step.id}`}
            type="number"
            min={1}
            max={52}
            value={step.suggestedDurationWeeks ?? ''}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              emit({ suggestedDurationWeeks: Number.isFinite(v) ? v : undefined })
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`start-${step.id}`} className="text-xs">
            Start date
          </Label>
          <Input
            id={`start-${step.id}`}
            type="date"
            value={step.startDate?.slice(0, 10) ?? ''}
            onChange={(e) => emit({ startDate: e.target.value || null })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`end-${step.id}`} className="text-xs">
            End date
          </Label>
          <Input
            id={`end-${step.id}`}
            type="date"
            value={step.endDate?.slice(0, 10) ?? ''}
            onChange={(e) => emit({ endDate: e.target.value || null })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`upskill-${step.id}`} className="text-xs">
          Upskilling plan
        </Label>
        <Textarea
          id={`upskill-${step.id}`}
          rows={3}
          value={step.upskillActions ?? ''}
          onChange={(e) => emit({ upskillActions: e.target.value })}
          placeholder="Courses, projects, practice routines…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`kpi-${step.id}`} className="text-xs">
          Completion KPI
        </Label>
        <Input
          id={`kpi-${step.id}`}
          value={step.completionKpi ?? ''}
          onChange={(e) => emit({ completionKpi: e.target.value })}
          placeholder="How you will know this step is done"
        />
      </div>
    </div>
  )
}
