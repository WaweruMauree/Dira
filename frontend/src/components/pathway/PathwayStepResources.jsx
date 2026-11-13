import LearningResourceSections from '@/components/skills/LearningResourceSections'
import { useStepAgentResources } from '@/hooks/useStepAgentResources'

export default function PathwayStepResources({ step, gapReport, targetRole }) {
  const skillName = step?.skillName
  const { groups, meta, loading, error } = useStepAgentResources(gapReport, targetRole, skillName)

  if (!skillName) return null

  return (
    <div id="pathway-linked-resources" className="pt-2 border-t border-hairline">
      <p className="text-sm text-ink mb-3">
        Agent sourced resources for <span className="font-semibold">{skillName}</span>
      </p>
      <LearningResourceSections
        showCuratedCatalog={false}
        showAgentSectionTitle={false}
        hideAgentSkillHeadings
        agentGroups={groups}
        agentMeta={meta}
        agentLoading={loading}
        agentError={error}
        hasDevelopmentSkills
        agentDensity="comfortable"
      />
    </div>
  )
}
