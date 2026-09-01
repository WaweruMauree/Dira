import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COURSES, YEARS_OF_STUDY } from '@/constants/skills'

export default function OnboardingStep1({ form, errors, updateField }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-medium text-ink mb-1">Academic information</h2>
        <p className="text-muted text-sm">Tell us about your programme and year of study.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="course">Course / Programme</Label>
        <Select value={form.course} onValueChange={(v) => updateField('course', v)}>
          <SelectTrigger id="course">
            <SelectValue placeholder="Select your course" />
          </SelectTrigger>
          <SelectContent>
            {COURSES.map((course) => (
              <SelectItem key={course} value={course}>{course}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.course && <p className="text-sm text-destructive">{errors.course}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="year">Year of study</Label>
        <Select value={String(form.yearOfStudy)} onValueChange={(v) => updateField('yearOfStudy', v)}>
          <SelectTrigger id="year">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS_OF_STUDY.map((year) => (
              <SelectItem key={year} value={String(year)}>Year {year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.yearOfStudy && <p className="text-sm text-destructive">{errors.yearOfStudy}</p>}
      </div>
    </div>
  )
}
