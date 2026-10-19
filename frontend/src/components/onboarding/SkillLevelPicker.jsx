import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import SkillLevelCriteriaCard from '@/components/skills/SkillLevelCriteriaCard'
import { SKILL_LEVEL_OPTIONS, skillLevelLabel } from '@/constants/skillLevels'
import { cn } from '@/lib/utils'

function LevelButton({
  option,
  active,
  onChange,
  rubricsEnabled,
  levelRubric,
  loadingRubric,
  onHoverOpen,
}) {
  const button = (
    <Button
      type="button"
      variant={active ? 'accent' : 'outline'}
      size="sm"
      className={cn(
        'h-9 min-w-9 rounded-full px-3 text-xs font-medium',
        !active && 'text-muted hover:text-ink'
      )}
      aria-pressed={active}
      aria-label={
        levelRubric?.summary
          ? `${option.label}: ${levelRubric.summary}${active ? ', selected' : ''}`
          : `${option.label}${active ? ', selected' : ''}`
      }
      title={rubricsEnabled && !levelRubric && !loadingRubric ? option.label : undefined}
      onClick={() => onChange(option.id)}
    >
      <span className="sm:hidden">{option.shortLabel}</span>
      <span className="hidden sm:inline">{option.label}</span>
    </Button>
  )

  if (!rubricsEnabled) {
    return button
  }

  return (
    <HoverCard
      onOpenChange={(open) => {
        if (open) onHoverOpen?.(option.id)
      }}
    >
      <HoverCardTrigger asChild>{button}</HoverCardTrigger>
      <HoverCardContent side="top" align="start">
        {loadingRubric && !levelRubric ? (
          <p className="text-xs text-muted max-w-[240px]">Loading criteria…</p>
        ) : levelRubric ? (
          <SkillLevelCriteriaCard
            levelLabel={option.label}
            summary={levelRubric.summary}
            criteria={levelRubric.criteria}
          />
        ) : (
          <p className="text-xs text-muted max-w-[240px]">Loading criteria…</p>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

export default function SkillLevelPicker({
  value,
  onChange,
  skillName,
  rubricForSkill = null,
  rubricsEnabled = false,
  skillCategory = 'TECHNICAL',
  fetchRubricForSkill,
  onRubricLoaded,
}) {
  const groupLabel = skillName ? `Level for ${skillName}` : 'Skill level'
  const [loadingLevel, setLoadingLevel] = useState(null)

  const handleHoverOpen = async (levelId) => {
    if (!rubricsEnabled || !fetchRubricForSkill || !skillName) return
    const levelKey = String(levelId)
    if (rubricForSkill?.levels?.[levelKey]) return

    if (!rubricForSkill) {
      setLoadingLevel(levelId)
      try {
        const rubric = await fetchRubricForSkill(skillName, skillCategory)
        if (rubric) onRubricLoaded?.(skillName, rubric)
      } finally {
        setLoadingLevel(null)
      }
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label={groupLabel}
    >
      <span className="text-xs text-muted sr-only sm:not-sr-only sm:mr-1">{groupLabel}</span>
      {SKILL_LEVEL_OPTIONS.map((option) => {
        const active = value === option.id
        const levelKey = String(option.id)
        const levelRubric = rubricForSkill?.levels?.[levelKey] ?? null
        const loadingRubric = loadingLevel === option.id
        return (
          <LevelButton
            key={option.id}
            option={option}
            active={active}
            onChange={onChange}
            rubricsEnabled={rubricsEnabled}
            levelRubric={levelRubric}
            loadingRubric={loadingRubric}
            onHoverOpen={handleHoverOpen}
          />
        )
      })}
      <span className="sr-only">Current level: {skillLevelLabel(value)}</span>
    </div>
  )
}
