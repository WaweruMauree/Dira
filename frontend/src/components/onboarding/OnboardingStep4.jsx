import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const MAX_FEEDBACK_LENGTH = 4000

export default function OnboardingStep4({ form, errors, updateField }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-medium text-ink mb-1">Your job search so far</h2>
        <p className="text-muted text-sm">
          What challenges have you faced in your career search, and what would help? Use short
          bullet points.
        </p>
        <p className="text-xs text-muted mt-2">*Optional* - your answer helps us improve Dira.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="careerSearchFeedback" className="sr-only">
          Career search feedback
        </Label>
        <Textarea
          id="careerSearchFeedback"
          value={form.careerSearchFeedback}
          onChange={(e) => updateField('careerSearchFeedback', e.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
          placeholder="Talk to us"
          className="min-h-[120px] rounded-xl border-hairline resize-y"
          maxLength={MAX_FEEDBACK_LENGTH}
        />
        {errors.careerSearchFeedback && (
          <p className="text-sm text-destructive">{errors.careerSearchFeedback}</p>
        )}
      </div>
    </div>
  )
}
