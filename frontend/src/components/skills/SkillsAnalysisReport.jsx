import SkillsAnalysisInterestPanel from '@/components/skills/SkillsAnalysisInterestPanel'
import SkillsAgentRecommendations from '@/components/skills/SkillsAgentRecommendations'
import CareerInterestTabs from '@/components/career/CareerInterestTabs'
import { SKILLS_ANALYSIS_LOADING_MESSAGE } from '@/constants/skillsAnalysis'

export default function SkillsAnalysisReport({
  interests,
  activeInterest,
  onSelectInterest,
  reportsByInterest,
  interestErrors = {},
  loadingByInterest = {},
  agentRecs,
}) {
  if (!interests.length) {
    return (
      <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-sm text-muted">
        Add career interests in onboarding or your profile to run skills analysis.
      </div>
    )
  }

  const current = activeInterest || interests[0]
  const report = reportsByInterest[current]
  const tabLoading = Boolean(loadingByInterest[current])

  return (
    <div className="space-y-4">
      <CareerInterestTabs
        interests={interests}
        active={current}
        onSelect={onSelectInterest}
      />

      {report ? (
        <div className="rounded-xl border border-hairline bg-card-bg p-6 shadow-card space-y-8">
          <SkillsAnalysisInterestPanel report={report} />
          <div className="pt-4 border-t border-hairline">
            <p className="font-medium text-sm text-ink mb-2">Agent-sourced courses & videos</p>
            <SkillsAgentRecommendations groups={agentRecs} />
          </div>
        </div>
      ) : interestErrors?.[current] ? (
        <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-sm text-destructive">
          {interestErrors[current]}
        </div>
      ) : tabLoading ? (
        <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-sm text-muted">
          {SKILLS_ANALYSIS_LOADING_MESSAGE}
        </div>
      ) : (
        <p className="text-sm text-muted">No report for this interest yet.</p>
      )}
    </div>
  )
}
