import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COURSE_OPTIONS, OTHER_COURSE_ID, YEARS_OF_STUDY } from '@/constants/skills'

export default function OnboardingStep1({ form, errors, updateField }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-medium text-ink mb-1">Academic information</h2>
        <p className="text-muted text-sm">
          Tell us about your programme and year of study. We&apos;ll tailor skills and career interests
          to your programme on the next steps.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="course">Course / Programme</Label>
        <Select
          value={form.courseCatalogId}
          onValueChange={(v) => updateField('courseCatalogId', v)}
        >
          <SelectTrigger id="course">
            <SelectValue placeholder="Select your course" />
          </SelectTrigger>
          <SelectContent>
            {COURSE_OPTIONS.map(({ id, label }) => (
              <SelectItem key={id} value={id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.courseCatalogId && (
          <p className="text-sm text-destructive">{errors.courseCatalogId}</p>
        )}
      </div>

      {form.courseCatalogId === OTHER_COURSE_ID && (
        <div className="space-y-2">
          <Label htmlFor="otherProgramme">Specify your programme</Label>
          <Input
            id="otherProgramme"
            value={form.otherProgramme}
            onChange={(e) => updateField('otherProgramme', e.target.value)}
            placeholder="e.g. BSc Agriculture"
            maxLength={150}
          />
          {errors.otherProgramme && (
            <p className="text-sm text-destructive">{errors.otherProgramme}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="year">Year of study</Label>
        <Select value={String(form.yearOfStudy)} onValueChange={(v) => updateField('yearOfStudy', v)}>
          <SelectTrigger id="year">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS_OF_STUDY.map((year) => (
              <SelectItem key={year} value={String(year)}>
                Year {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.yearOfStudy && <p className="text-sm text-destructive">{errors.yearOfStudy}</p>}
      </div>
    </div>
  )
}
