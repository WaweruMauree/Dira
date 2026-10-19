import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/ErrorBoundary'
import SkillsAnalysisReport from '@/components/skills/SkillsAnalysisReport'
import SkillsAnalysisChatPopup from '@/components/skills/SkillsAnalysisChatPopup'
import { SKILLS_ANALYSIS_LOADING_MESSAGE } from '@/constants/skillsAnalysis'
import { useSkillsAnalysis, OPENROUTER_SETUP_HINT } from '@/hooks/useSkillsAnalysis'
import { mergeWebSearchRecs } from '@/lib/skills/webSearchRecs'

export default function SkillsAnalysisPage() {
  const {
    interests,
    reportsByInterest,
    interestErrors,
    loadingByInterest,
    activeInterest,
    setActiveInterest,
    loading,
    error,
    openRouterReady,
    refresh,
  } = useSkillsAnalysis()
  const [agentRecs, setAgentRecs] = useState([])
  const reportsReady = !loading && interests.length > 0 && Object.keys(reportsByInterest).length > 0

  const handleToolComplete = (name, input, output) => {
    if (name === 'webSearch') {
      setAgentRecs((prev) => mergeWebSearchRecs(prev, input?.query, output))
    }
  }

  return (
    <div className="h-[calc(100vh-0px)] md:h-screen min-h-0 p-4 md:p-6 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent font-bold mb-1">
            Career development
          </p>
          <h1 className="font-heading text-2xl font-medium text-ink">Skills Analysis</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={loading}
          onClick={() => refresh()}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh analysis
        </Button>
      </div>

      {openRouterReady === false && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive mb-3 shrink-0">
          Custom career interests need OpenRouter on the backend. {OPENROUTER_SETUP_HINT}
        </div>
      )}

      {error && <p className="text-sm text-destructive mb-3 shrink-0">{error}</p>}

      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {loading && !Object.keys(reportsByInterest).length && !error ? (
          <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-sm text-muted">
            {SKILLS_ANALYSIS_LOADING_MESSAGE}
          </div>
        ) : (
          <ErrorBoundary onReset={() => refresh()}>
            <SkillsAnalysisReport
              interests={interests}
              activeInterest={activeInterest}
              onSelectInterest={setActiveInterest}
              reportsByInterest={reportsByInterest}
              interestErrors={interestErrors}
              loadingByInterest={loadingByInterest}
              agentRecs={agentRecs}
            />
          </ErrorBoundary>
        )}
      </div>

      {!loading && interests.length === 0 && (
        <p className="text-sm text-muted mt-4 shrink-0">
          <Link to="/profile" className="text-accent hover:underline">
            Update your profile
          </Link>{' '}
          to add career interests.
        </p>
      )}

      <SkillsAnalysisChatPopup
        reportsByInterest={reportsByInterest}
        onToolComplete={handleToolComplete}
        autoPromptReady={reportsReady}
      />
    </div>
  )
}
