import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  addWeeksFromStart,
  draftFromStep,
  weeksBetweenDates,
  parseISODateLocal,
} from '@/lib/pathway/planDates'

export default function PathwayPlanEditor({ step, onSave, onCancel, saving }) {
  const [draft, setDraft] = useState(() => draftFromStep(step))
  const [dateMode, setDateMode] = useState('duration')

  useEffect(() => {
    setDraft(draftFromStep(step))
    setDateMode('duration')
  }, [step?.id, step])

  if (!step) return null

  const updateDraft = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  const handleDurationChange = (raw) => {
    const v = parseInt(raw, 10)
    const weeks = Number.isFinite(v) ? v : undefined
    setDateMode('duration')
    const next = { suggestedDurationWeeks: weeks }
    if (weeks && draft.startDate) {
      const end = addWeeksFromStart(draft.startDate, weeks)
      if (end) next.endDate = end
    }
    updateDraft(next)
  }

  const handleStartChange = (value) => {
    const startDate = value || null
    if (dateMode === 'dates') {
      const patch = { startDate }
      if (startDate && draft.endDate) {
        const weeks = weeksBetweenDates(startDate, draft.endDate)
        if (weeks) patch.suggestedDurationWeeks = weeks
      }
      updateDraft(patch)
      return
    }
    setDateMode('duration')
    const patch = { startDate }
    if (startDate && draft.suggestedDurationWeeks) {
      const end = addWeeksFromStart(startDate, draft.suggestedDurationWeeks)
      if (end) patch.endDate = end
    }
    updateDraft(patch)
  }

  const handleEndChange = (value) => {
    const endDate = value || null
    setDateMode('dates')
    const patch = { endDate }
    if (draft.startDate && endDate) {
      const weeks = weeksBetweenDates(draft.startDate, endDate)
      if (weeks) patch.suggestedDurationWeeks = weeks
    }
    updateDraft(patch)
  }

  const handleSave = () => {
    onSave?.({
      suggestedDurationWeeks: draft.suggestedDurationWeeks,
      startDate: draft.startDate,
      endDate: draft.endDate,
      upskillActions: draft.upskillActions,
      completionKpi: draft.completionKpi,
    })
  }

  const startMin = draft.startDate ? parseISODateLocal(draft.startDate) : undefined
  const endMax = draft.endDate ? parseISODateLocal(draft.endDate) : undefined
  const showDateHint = Boolean(draft.startDate && draft.endDate)

  const scheduleLabelClass = 'text-muted text-xs uppercase tracking-wider font-mono'

  return (
    <div className="space-y-4 rounded-lg border border-hairline bg-secondary/20 p-4">
      <div className="space-y-3">
        <p className={scheduleLabelClass}>Schedule</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor={`duration-${step.id}`} className={scheduleLabelClass}>
              Duration (weeks)
            </Label>
            <Input
              id={`duration-${step.id}`}
              type="number"
              min={1}
              max={52}
              className="bg-card-bg"
              value={draft.suggestedDurationWeeks ?? ''}
              onChange={(e) => handleDurationChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`start-${step.id}`} className={scheduleLabelClass}>
              Start date
            </Label>
            <DatePicker
              id={`start-${step.id}`}
              value={draft.startDate?.slice(0, 10) ?? null}
              onChange={handleStartChange}
              placeholder="Select start"
              aria-label="Start date"
              disabledMatchers={
                endMax
                  ? {
                      after: endMax,
                    }
                  : undefined
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`end-${step.id}`} className={scheduleLabelClass}>
              End date
            </Label>
            <DatePicker
              id={`end-${step.id}`}
              value={draft.endDate?.slice(0, 10) ?? null}
              onChange={handleEndChange}
              placeholder="Select end"
              aria-label="End date"
              disabledMatchers={
                startMin
                  ? {
                      before: startMin,
                    }
                  : undefined
              }
            />
          </div>
        </div>
        {showDateHint ? (
          <p className="text-xs text-muted">
            Duration updates when you change start or end; changing weeks updates the end date when a
            start date is set.
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`upskill-${step.id}`} className={scheduleLabelClass}>
          Upskilling plan
        </Label>
        <Textarea
          id={`upskill-${step.id}`}
          rows={3}
          className="bg-card-bg"
          value={draft.upskillActions ?? ''}
          onChange={(e) => updateDraft({ upskillActions: e.target.value })}
          placeholder="Courses, projects, practice routines…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`kpi-${step.id}`} className={scheduleLabelClass}>
          Completion KPI
        </Label>
        <Input
          id={`kpi-${step.id}`}
          className="bg-card-bg"
          value={draft.completionKpi ?? ''}
          onChange={(e) => updateDraft({ completionKpi: e.target.value })}
          placeholder="How you will know this step is done"
        />
      </div>

      <div className="flex flex-wrap gap-2 justify-end pt-1">
        <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="accent" size="sm" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save plan'}
        </Button>
      </div>
    </div>
  )
}
