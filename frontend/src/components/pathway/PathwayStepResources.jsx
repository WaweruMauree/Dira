import LearningResourceSections from '@/components/skills/LearningResourceSections'
import { resourcesForSkill } from '@/lib/skills/resourceFilters'
import { useStepAgentResources } from '@/hooks/useStepAgentResources'

export default function PathwayStepResources({ step, gapReport, targetRole }) {
  const skillName = step?.skillName
  const curated = resourcesForSkill(gapReport?.curatedResources ?? [], skillName)
  const { groups, meta, loading, error } = useStepAgentResources(gapReport, targetRole, skillName)

  if (!skillName) return null

  return (
    <div id="pathway-linked-resources" className="pt-2 border-t border-hairline">
      <p className="font-medium text-sm text-ink mb-3">Resources for {skillName}</p>
      <LearningResourceSections
        curatedResources={curated}
        agentGroups={groups}
        agentMeta={meta}
        agentLoading={loading}
        agentError={error}
        hasDevelopmentSkills
        minCurated={2}
        agentDensity="comfortable"
        curatedEmptyMessage={`No curated catalog entries tagged to ${skillName} yet.`}
      />
    </div>
  )
}
