import SkillsCuratedResources from '@/components/skills/SkillsCuratedResources'
import SkillsAgentRecommendations from '@/components/skills/SkillsAgentRecommendations'
import { minItemsHint } from '@/lib/skills/resourceFilters'

export default function LearningResourceSections({
  curatedResources = [],
  agentGroups = [],
  agentMeta,
  agentLoading = false,
  agentError,
  hasDevelopmentSkills = true,
  curatedEmptyMessage,
  minCurated = 2,
  className = '',
  agentDensity = 'compact',
  showCuratedCatalog = true,
  showAgentSectionTitle = true,
  hideAgentSkillHeadings = false,
}) {
  const hint = minCurated > 0 ? minItemsHint(curatedResources.length, minCurated) : null

  return (
    <div className={`space-y-6 ${className}`}>
      {showCuratedCatalog ? (
        <div>
          <p className="font-medium text-sm text-ink mb-2">Curated Learning (Dira Catalog)</p>
          {hint ? <p className="text-xs text-muted mb-2">{hint}</p> : null}
          <SkillsCuratedResources
            resources={curatedResources}
            emptyMessage={
              curatedEmptyMessage ??
              'No curated resources in catalog for these skills yet.'
            }
          />
        </div>
      ) : null}
      <div className={showCuratedCatalog ? 'pt-4 border-t border-hairline' : ''}>
        {showAgentSectionTitle ? (
          <p className="font-medium text-sm text-ink mb-2">Agent-sourced Videos and Papers</p>
        ) : null}
        <SkillsAgentRecommendations
          groups={agentGroups}
          meta={agentMeta}
          loading={agentLoading}
          error={agentError}
          hasDevelopmentSkills={hasDevelopmentSkills}
          density={agentDensity}
          hideSkillHeadings={hideAgentSkillHeadings}
        />
      </div>
    </div>
  )
}
