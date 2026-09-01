import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { READINESS_LEVELS } from '@/constants/readiness'
import { cn } from '@/lib/utils'

export default function OnboardingStep3({ form, errors, interestOptions, toggleInterest, updateField }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-medium text-ink mb-1">Career direction</h2>
        <p className="text-muted text-sm">Select your interests and current career readiness level.</p>
      </div>

      <div className="space-y-3">
        <Label>Career interests</Label>
        <div className="flex flex-wrap gap-2">
          {interestOptions.map((interest) => {
            const selected = form.careerInterests.includes(interest)
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className="focus:outline-none"
              >
                <Badge
                  variant={selected ? 'accent' : 'outline'}
                  className={cn('cursor-pointer px-3 py-1', selected && 'ring-2 ring-accent/50')}
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
