import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Map, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CareerInterestTabs from '@/components/career/CareerInterestTabs'
import PathwayTimeline from '@/components/pathway/PathwayTimeline'
import PathwayStepPanel from '@/components/pathway/PathwayStepPanel'
import { useCareerPathway } from '@/hooks/useCareerPathway'
import { developmentSkillNamesFromReport } from '@/lib/pathway/progressFromReport'

export default function CareerPathwayPage() {
  const {
    loading,
    tabLoading,
    inlineTabLoading,
    error,
    saveError,
    needsAnalysis,
    needsAnalysisEmpty,
    roadmap,
    steps,
    activeInterest,
    setActiveInterest,
    interests,
    selectedStep,
    selectedStepId,
    setSelectedStepId,
    savePlanStep,
    setStepStatus,
    regenerateForRole,
    curatedResources,
    setResourcesSkillFilter,
    resourcesSkillFilter,
    progressSummary,
    gapReport,
  } = useCareerPathway()

  const [altRole, setAltRole] = useState('')
  const [showResources, setShowResources] = useState(false)

  useEffect(() => {
    setShowResources(Boolean(resourcesSkillFilter))
  }, [resourcesSkillFilter])

  const handleViewResources = (skillName) => {
    setResourcesSkillFilter(skillName)
    setShowResources(true)
    requestAnimationFrame(() => {
      document.getElementById('pathway-linked-resources')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  const titleRole = roadmap?.targetRole || activeInterest || 'your role'
  const totalSkillsInPlan =
    progressSummary?.totalSteps ?? developmentSkillNamesFromReport(gapReport).length

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-3 min-w-0">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent font-bold mb-1">
              Career development
            </p>
            <h1 className="font-heading text-2xl font-medium text-ink flex items-center gap-2">
              <Map className="h-6 w-6 text-accent shrink-0" />
              Pathway to {titleRole}
            </h1>
            {progressSummary && totalSkillsInPlan > 0 && (
              <p className="text-sm text-muted mt-1">
                {progressSummary.completedSteps} of {totalSkillsInPlan} skills complete (
                {progressSummary.percent}%)
              </p>
            )}
          </div>
          {interests.length > 1 && (
            <CareerInterestTabs
              interests={interests}
              active={activeInterest}
              onSelect={setActiveInterest}
            />
          )}
        </div>

        {!needsAnalysis && !needsAnalysisEmpty && (
          <div className="flex flex-col gap-2 sm:min-w-[14rem] shrink-0">
            <label className="text-xs text-muted" htmlFor="alt-role">
              Explore alternative role
            </label>
            <div className="flex gap-2">
              <Input
                id="alt-role"
                placeholder="e.g. Product Analyst"
                value={altRole}
                onChange={(e) => setAltRole(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={tabLoading || !altRole.trim()}
                title="Generate pathway for role"
                onClick={() => regenerateForRole(altRole.trim())}
              >
                <RefreshCw className={`h-4 w-4 ${tabLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-sm text-muted">
          Building your pathway…
        </div>
      )}

      {!loading && inlineTabLoading && (
        <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-sm text-muted">
          Building your pathway…
        </div>
      )}

      {!loading && !inlineTabLoading && (needsAnalysisEmpty || needsAnalysis) && (
        <div className="rounded-xl border border-hairline bg-card-bg p-10 text-center space-y-4 shadow-card">
          <p className="text-sm text-muted max-w-md mx-auto">
            {needsAnalysisEmpty
              ? 'Add career interests in your profile, then run skills analysis to generate a pathway.'
              : 'Run a skills analysis first so Dira can map your gaps into a step-by-step career pathway and work plan.'}
          </p>
          <Button asChild>
            <Link to={needsAnalysisEmpty ? '/profile' : '/skills-analysis'}>
              {needsAnalysisEmpty ? 'Go to Profile' : 'Go to Skills Analysis'}
            </Link>
          </Button>
        </div>
      )}

      {!loading && !inlineTabLoading && !needsAnalysis && !needsAnalysisEmpty && roadmap && (
        <>
          <div className="rounded-xl border border-hairline bg-card-bg p-4 md:p-6 shadow-card">
            <PathwayTimeline
              steps={steps}
              selectedStepId={selectedStepId}
              onSelectStep={setSelectedStepId}
              progressPercent={progressSummary?.percent ?? 0}
              totalSkillCount={totalSkillsInPlan}
            />
          </div>

          <PathwayStepPanel
            step={selectedStep}
            onSaveStep={savePlanStep}
            onSetStatus={setStepStatus}
            onViewResources={handleViewResources}
            curatedResources={curatedResources}
            showResources={showResources}
            saveError={saveError}
          />
        </>
      )}
    </div>
  )
}
