import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SkillLevelPicker from '@/components/onboarding/SkillLevelPicker'
import { useSkillProficiencyRubrics } from '@/hooks/useSkillProficiencyRubrics'
import { YEARS_OF_STUDY } from '@/constants/skills'
import { DEFAULT_SKILL_LEVEL, skillLevelLabel } from '@/constants/skillLevels'
import { getCareerInterestsForCourse, getProfileKey, getTechnicalSkillsForCourse, getSoftSkillsForCourse, OTHER_COURSE_ID } from '@/constants/skills'

function skillsMapsFromMe(me) {
  const technical = {}
  const soft = {}
  for (const row of me.skills ?? []) {
    const name = row.skills?.name
    const cat = row.skills?.category
    const level = row.proficiency_level ?? DEFAULT_SKILL_LEVEL
    if (!name) continue
    if (cat === 'TECH') technical[name] = level
    else soft[name] = level
  }
  return { technical, soft }
}

function interestNamesFromMe(me) {
  return (me.interests ?? []).map((r) => r.area).filter(Boolean)
}

export default function ProfileCareerEditor({ me, onSave, saving, embedded, onNotice }) {
  const profileKey = useMemo(() => {
    return getProfileKey({
      courseCatalogId: OTHER_COURSE_ID,
      otherProgramme: me?.student?.course ?? '',
    })
  }, [me])

  const presetInterests = useMemo(() => getCareerInterestsForCourse(profileKey), [profileKey])
  const presetTechnical = useMemo(() => getTechnicalSkillsForCourse(profileKey), [profileKey])
  const presetSoft = useMemo(() => getSoftSkillsForCourse(profileKey), [profileKey])

  const [year, setYear] = useState(String(me.studentProfile?.year_of_study ?? ''))
  const [interests, setInterests] = useState(() => interestNamesFromMe(me))
  const [interestDraft, setInterestDraft] = useState('')
  const [technical, setTechnical] = useState(() => skillsMapsFromMe(me).technical)
  const [soft, setSoft] = useState(() => skillsMapsFromMe(me).soft)
  const [customTechDraft, setCustomTechDraft] = useState('')

  const allTechNames = useMemo(() => {
    const custom = Object.keys(technical).filter((n) => !presetTechnical.includes(n))
    return [...presetTechnical, ...custom.sort()]
  }, [technical, presetTechnical])

  const allSoftNames = useMemo(() => {
    const custom = Object.keys(soft).filter((n) => !presetSoft.includes(n))
    return [...presetSoft, ...custom.sort()]
  }, [soft, presetSoft])

  const courseLabel = me?.student?.course ?? profileKey
  const {
    rubricsBySkill,
    enabled: rubricsEnabled,
    fetchRubricForSkill,
    mergeRubric,
  } = useSkillProficiencyRubrics({
    courseCatalogId: profileKey,
    courseLabel,
    technicalSkills: allTechNames,
    softSkills: allSoftNames,
    presetTechnicalSkills: presetTechnical,
    presetSoftSkills: presetSoft,
  })

  const toggleInterest = (name) => {
    setInterests((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    )
  }

  const addInterest = () => {
    const t = interestDraft.trim()
    if (t.length < 2) return
    if (!interests.some((i) => i.toLowerCase() === t.toLowerCase())) {
      setInterests((prev) => [...prev, t])
    }
    setInterestDraft('')
  }

  const toggleSkill = (category, name) => {
    const setter = category === 'technical' ? setTechnical : setSoft
    setter((prev) => {
      const next = { ...prev }
      if (next[name] !== undefined) delete next[name]
      else next[name] = DEFAULT_SKILL_LEVEL
      return next
    })
  }

  const setLevel = (category, name, level) => {
    const setter = category === 'technical' ? setTechnical : setSoft
    setter((prev) => ({ ...prev, [name]: level }))
  }

  const addCustomTech = () => {
    const t = customTechDraft.trim()
    if (t.length < 2) return
    setTechnical((prev) => ({ ...prev, [t]: DEFAULT_SKILL_LEVEL }))
    setCustomTechDraft('')
  }

  const handleSave = async () => {
    if (!year) {
      onNotice?.({ variant: 'error', message: 'Select your year of study' })
      return
    }
    if (interests.length === 0) {
      onNotice?.({ variant: 'error', message: 'Add at least one career interest' })
      return
    }
    if (Object.keys(technical).length === 0 || Object.keys(soft).length === 0) {
      onNotice?.({
        variant: 'error',
        message: 'Keep at least one technical and one soft skill selected',
      })
      return
    }
    try {
      await onSave({
        yearOfStudy: Number(year),
        careerInterests: interests,
        technicalSkills: technical,
        softSkills: soft,
      })
    } catch {
      /* parent sets error notice */
    }
  }

  return (
    <section className={embedded ? 'space-y-6' : 'rounded-xl border border-hairline bg-card-bg p-6 shadow-card space-y-6'}>
      {!embedded && (
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-medium text-ink">Career progression</h2>
        <Button variant="accent" size="sm" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
      )}
      {embedded && (
        <div className="flex justify-end">
          <Button variant="accent" size="sm" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label>Year of study</Label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS_OF_STUDY.map((y) => (
              <SelectItem key={y} value={String(y)}>
                Year {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Career interests</Label>
        <div className="flex flex-wrap gap-2">
          {presetInterests.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleInterest(item)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                interests.includes(item)
                  ? 'bg-accent/25 border-accent text-ink'
                  : 'border-hairline text-muted hover:border-accent/50'
              }`}
            >
              {item}
            </button>
          ))}
          {interests
            .filter((i) => !presetInterests.includes(i))
            .map((item) => (
              <Badge key={item} variant="accent" className="cursor-pointer" onClick={() => toggleInterest(item)}>
                {item} ×
              </Badge>
            ))}
        </div>
        <div className="flex gap-2 max-w-md">
          <Input
            value={interestDraft}
            onChange={(e) => setInterestDraft(e.target.value)}
            placeholder="Add custom interest"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
          />
          <Button type="button" variant="outline" size="sm" onClick={addInterest}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Technical skills</Label>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {allTechNames.map((name) => (
            <div key={name} className="rounded-lg border border-hairline p-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={technical[name] !== undefined}
                  onCheckedChange={() => toggleSkill('technical', name)}
                  id={`pt-${name}`}
                />
                <Label htmlFor={`pt-${name}`} className="text-sm cursor-pointer flex-1">
                  {name}
                </Label>
                {technical[name] !== undefined && (
                  <span className="text-[10px] text-muted">{skillLevelLabel(technical[name])}</span>
                )}
              </div>
              {technical[name] !== undefined && (
                <div className="pl-6 mt-2">
                  <SkillLevelPicker
                    skillName={name}
                    value={technical[name]}
                    onChange={(v) => setLevel('technical', name, v)}
                    rubricForSkill={rubricsBySkill[name] ?? null}
                    rubricsEnabled={rubricsEnabled}
                    skillCategory="TECHNICAL"
                    fetchRubricForSkill={fetchRubricForSkill}
                    onRubricLoaded={mergeRubric}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 max-w-md">
          <Input
            value={customTechDraft}
            onChange={(e) => setCustomTechDraft(e.target.value)}
            placeholder="Add technical skill"
          />
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addCustomTech}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Soft skills</Label>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {allSoftNames.map((name) => (
            <div key={name} className="rounded-lg border border-hairline p-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={soft[name] !== undefined}
                  onCheckedChange={() => toggleSkill('soft', name)}
                  id={`ps-${name}`}
                />
                <Label htmlFor={`ps-${name}`} className="text-sm cursor-pointer flex-1">
                  {name}
                </Label>
              </div>
              {soft[name] !== undefined && (
                <div className="pl-6 mt-2">
                  <SkillLevelPicker
                    skillName={name}
                    value={soft[name]}
                    onChange={(v) => setLevel('soft', name, v)}
                    rubricForSkill={rubricsBySkill[name] ?? null}
                    rubricsEnabled={rubricsEnabled}
                    skillCategory="SOFT"
                    fetchRubricForSkill={fetchRubricForSkill}
                    onRubricLoaded={mergeRubric}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
