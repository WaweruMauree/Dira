import { useMemo } from 'react'
import { useStudentAppData, OPENROUTER_SETUP_HINT } from '@/context/StudentAppDataProvider'

export { OPENROUTER_SETUP_HINT }

export function buildSkillsAnalysisSummary(reportsByInterest) {
  return Object.entries(reportsByInterest ?? {}).map(([interest, report]) => ({
    interest,
    matchedRole: report?.pathwayRole?.title ?? null,
    gaps: report?.gaps ?? [],
    upskills: report?.upskills ?? [],
    strengths: report?.strengths ?? [],
  }))
}

export function useSkillsAnalysis() {
  const { skills } = useStudentAppData()

  const loading = useMemo(() => {
    if (!skills.interestsLoaded) return true
    const anyTabLoading = Object.values(skills.loadingByInterest).some(Boolean)
    const hasAnyReport = Object.keys(skills.reportsByInterest).length > 0
    if (hasAnyReport && !anyTabLoading) return false
    if (skills.interests.length === 0) return false
    return anyTabLoading && !hasAnyReport
  }, [
    skills.interestsLoaded,
    skills.loadingByInterest,
    skills.reportsByInterest,
    skills.interests.length,
  ])

  return {
    interests: skills.interests,
    reportsByInterest: skills.reportsByInterest,
    interestErrors: skills.interestErrors,
    loadingByInterest: skills.loadingByInterest,
    activeInterest: skills.activeInterest,
    setActiveInterest: skills.setActiveInterest,
    loading,
    error: skills.error,
    openRouterReady: skills.openRouterReady,
    refresh: skills.refresh,
  }
}
