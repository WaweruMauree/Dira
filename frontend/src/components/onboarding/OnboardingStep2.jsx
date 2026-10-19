import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SkillLevelPicker from '@/components/onboarding/SkillLevelPicker'
import { DEFAULT_SKILL_LEVEL, normalizeSkillLevel } from '@/constants/skillLevels'

function SkillSection({
  title,
  skills,
  selected,
  errors,
  errorKey,
  onToggle,
  onLevelChange,
  onAddCustom,
  rubricsBySkill,
  rubricsEnabled,
  skillCategory,
  fetchRubricForSkill,
  mergeRubric,
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState('')

  const handleAdd = () => {
    if (onAddCustom(draft)) {
      setDraft('')
      setShowAdd(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-ink">{title}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 shrink-0"
          onClick={() => setShowAdd((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add skill
        </Button>
      </div>
      {errors[errorKey] && <p className="text-sm text-destructive">{errors[errorKey]}</p>}
      {showAdd && (
        <div className="flex gap-2 items-center rounded-lg border border-dashed border-hairline p-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Skill name"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
          <Button type="button" variant="accent" size="sm" onClick={handleAdd}>
            Add
          </Button>
        </div>
      )}
      <div className="space-y-3">
        {skills.map((skill) => {
          const isSelected = selected[skill] !== undefined
          const level = normalizeSkillLevel(selected[skill] ?? DEFAULT_SKILL_LEVEL)
          return (
            <div key={skill} className="rounded-lg border border-hairline p-3">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  id={`skill-${title}-${skill}`}
                  checked={isSelected}
                  onCheckedChange={() => onToggle(skill)}
                />
                <Label htmlFor={`skill-${title}-${skill}`} className="cursor-pointer">
                  {skill}
                </Label>
              </div>
              {isSelected && (
                <div className="pl-6 pt-1">
                  <p className="text-xs text-muted mb-2">Self-assessed level</p>
                  <SkillLevelPicker
                    skillName={skill}
                    value={level}
                    onChange={(v) => onLevelChange(skill, v)}
                    rubricForSkill={rubricsBySkill[skill] ?? null}
                    rubricsEnabled={rubricsEnabled}
                    skillCategory={skillCategory}
                    fetchRubricForSkill={fetchRubricForSkill}
                    onRubricLoaded={mergeRubric}
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
  courseDisplayLabel,
  allTechnicalSkills,
  allSoftSkills,
  addCustomSkill,
  toggleSkill,
  setSkillLevel,
  rubricsBySkill,
  rubricsEnabled,
  fetchRubricForSkill,
  mergeRubric,
  suggestionsLoading,
  suggestionsFetchError,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-medium text-ink mb-1">Skills assessment</h2>
        <p className="text-muted text-sm">
          Skills tailored to your programme. Select what you have and rate each as Beginner,
          Intermediate, or Expert.
          {rubricsEnabled ? ' Hover a level to see what it means for each skill.' : null}
        </p>
        {form.courseCatalogId && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="accent">{courseDisplayLabel}</Badge>
            {suggestionsLoading ? (
              <span className="text-sm text-muted">Finding skills for {courseDisplayLabel}…</span>
            ) : null}
            {!suggestionsLoading && suggestionsFetchError ? (
              <span className="text-sm text-muted">
                Using default suggestions, you can still add your own.
              </span>
            ) : null}
          </div>
        )}
        {!form.courseCatalogId && (
          <p className="text-sm text-destructive mt-2">
            Please go back and select your course to see relevant skills.
          </p>
        )}
      </div>

      <SkillSection
        title="Technical skills"
        skills={allTechnicalSkills}
        selected={form.technicalSkills}
        errors={errors}
        errorKey="technicalSkills"
        onToggle={(skill) => toggleSkill('technical', skill)}
        onLevelChange={(skill, level) => setSkillLevel('technical', skill, level)}
        onAddCustom={(name) => addCustomSkill('technical', name)}
        rubricsBySkill={rubricsBySkill}
        rubricsEnabled={rubricsEnabled}
        skillCategory="TECHNICAL"
        fetchRubricForSkill={fetchRubricForSkill}
        mergeRubric={mergeRubric}
      />

      <SkillSection
        title="Soft skills"
        skills={allSoftSkills}
        selected={form.softSkills}
        errors={errors}
        errorKey="softSkills"
        onToggle={(skill) => toggleSkill('soft', skill)}
        onLevelChange={(skill, level) => setSkillLevel('soft', skill, level)}
        onAddCustom={(name) => addCustomSkill('soft', name)}
        rubricsBySkill={rubricsBySkill}
        rubricsEnabled={rubricsEnabled}
        skillCategory="SOFT"
        fetchRubricForSkill={fetchRubricForSkill}
        mergeRubric={mergeRubric}
      />
    </div>
  )
}
