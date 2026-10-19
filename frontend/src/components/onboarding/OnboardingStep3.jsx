import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { READINESS_LEVELS } from '@/constants/readiness'
import { cn } from '@/lib/utils'

export default function OnboardingStep3({
  form,
  errors,
  interestOptions,
  courseDisplayLabel,
  toggleInterest,
  addCustomInterest,
  updateField,
  suggestionsLoading,
  suggestionsFetchError,
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState('')

  const presetLower = new Set(interestOptions.map((i) => i.toLowerCase()))
  const customSelected = form.careerInterests.filter((i) => !presetLower.has(i.toLowerCase()))

  const handleAddInterest = () => {
    if (addCustomInterest(draft)) {
      setDraft('')
      setShowAdd(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-medium text-ink mb-1">Career direction</h2>
        <p className="text-muted text-sm">
          Interests suggested for your programme. Add any others that apply to you.
        </p>
        {courseDisplayLabel && suggestionsLoading ? (
          <p className="text-sm text-muted mt-2">Finding career paths for {courseDisplayLabel}…</p>
        ) : null}
        {!suggestionsLoading && suggestionsFetchError ? (
          <p className="text-sm text-muted mt-2">
            Using default suggestions, you can still add your own.
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Career interests</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setShowAdd((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add interest
          </Button>
        </div>
        {showAdd && (
          <div className="flex gap-2 items-center rounded-lg border border-dashed border-hairline p-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Your career interest"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
            />
            <Button type="button" variant="accent" size="sm" onClick={handleAddInterest}>
              Add
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {interestOptions.map((interest) => {
            const selected = form.careerInterests.includes(interest)
            return (
              <button key={interest} type="button" onClick={() => toggleInterest(interest)} className="focus:outline-none">
                <Badge
                  variant={selected ? 'accent' : 'outline'}
                  className={cn('cursor-pointer px-3 py-1', selected && 'ring-2 ring-accent/50')}
                >
                  {interest}
                </Badge>
              </button>
            )
          })}
          {customSelected.map((interest) => {
            const selected = form.careerInterests.includes(interest)
            return (
              <button key={interest} type="button" onClick={() => toggleInterest(interest)} className="focus:outline-none">
                <Badge
                  variant={selected ? 'accent' : 'outline'}
                  className={cn('cursor-pointer px-3 py-1 border-dashed', selected && 'ring-2 ring-accent/50')}
                >
                  {interest}
                </Badge>
              </button>
            )
          })}
        </div>
        {errors.careerInterests && <p className="text-sm text-destructive">{errors.careerInterests}</p>}
      </div>

      <div className="space-y-3">
        <Label>Career readiness level</Label>
        <RadioGroup value={form.careerReadiness} onValueChange={(v) => updateField('careerReadiness', v)}>
          {READINESS_LEVELS.map(({ value, label, description }) => (
            <div
              key={value}
              className={cn(
                'flex items-start gap-3 rounded-lg border border-hairline p-4',
                form.careerReadiness === value && 'border-accent bg-accent/10'
              )}
            >
              <RadioGroupItem value={value} id={value} className="mt-0.5" />
              <Label htmlFor={value} className="cursor-pointer flex-1">
                <span className="font-medium text-ink block">{label}</span>
                <span className="text-xs text-muted">{description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        {errors.careerReadiness && <p className="text-sm text-destructive">{errors.careerReadiness}</p>}
      </div>
    </div>
  )
}
