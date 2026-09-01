import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

function SkillSection({ title, skills, selected, errors, onToggle, onLevelChange, errorKey }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-ink">{title}</h3>
      {errors[errorKey] && <p className="text-sm text-destructive">{errors[errorKey]}</p>}
      <div className="space-y-3">
        {skills.map((skill) => {
          const isSelected = selected[skill] !== undefined
          const level = selected[skill] ?? 3
          return (
            <div key={skill} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id={`skill-${skill}`}
                  checked={isSelected}
                  onCheckedChange={() => onToggle(skill)}
                />
                <Label htmlFor={`skill-${skill}`} className="cursor-pointer">{skill}</Label>
              </div>
              {isSelected && (
                <div className="pl-6 space-y-1">
                  <div className="flex justify-between text-xs text-muted">
                    <span>Self-assessed level</span>
                    <span>{level}/5</span>
                  </div>
                  <Slider
                    value={[level]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={([v]) => onLevelChange(skill, v)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function OnboardingStep2({
  form,
  errors,
  courseProfile,
  technicalSkillOptions,
  softSkillOptions,
  toggleSkill,
  setSkillLevel,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-medium text-ink mb-1">Skills assessment</h2>
        <p className="text-muted text-sm">
          Skills tailored to your programme. Select what you have and rate your confidence from 1 to 5.
        </p>
        {form.course && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="accent">{form.course}</Badge>
            <span className="text-xs text-muted">
              Showing {courseProfile.label} skills — {technicalSkillOptions.length} technical,{' '}
              {softSkillOptions.length} soft
            </span>
          </div>
        )}
        {!form.course && (
          <p className="text-sm text-destructive mt-2">
            Please go back and select your course to see relevant skills.
          </p>
        )}
      </div>

      <SkillSection
        title="Technical skills"
        skills={technicalSkillOptions}
        selected={form.technicalSkills}
        errors={errors}
        errorKey="technicalSkills"
        onToggle={(skill) => toggleSkill('technical', skill)}
        onLevelChange={(skill, level) => setSkillLevel('technical', skill, level)}
      />

      <SkillSection
        title="Soft skills"
        skills={softSkillOptions}
        selected={form.softSkills}
        errors={errors}
        errorKey="softSkills"
        onToggle={(skill) => toggleSkill('soft', skill)}
        onLevelChange={(skill, level) => setSkillLevel('soft', skill, level)}
      />
    </div>
  )
}
