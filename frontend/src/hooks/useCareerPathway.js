import { useCallback, useMemo, useState } from 'react'
import { useStudentAppData } from '@/context/StudentAppDataProvider'
import { resolvePathwayProgress } from '@/lib/pathway/progressFromReport'

export function useCareerPathway() {
  const { pathway } = useStudentAppData()
  const [resourcesSkillFilter, setResourcesSkillFilter] = useState(null)

  const activeInterest = pathway.activeInterest || pathway.interests[0] || ''
  const pathwayRecord = activeInterest ? pathway.pathwaysByInterest[activeInterest] : null
  const gapReport = activeInterest ? pathway.getGapReport(activeInterest) : null
  const roadmap = pathwayRecord?.roadmapData ?? null
  const steps = roadmap?.steps ?? []

  const selectedStepId =
    (activeInterest && pathway.selectedStepByInterest[activeInterest]) ??
    steps[0]?.id ??
    null

  const selectedStep = useMemo(() => {
    if (!steps.length) return null
    const id = selectedStepId ?? steps[0]?.id
    return steps.find((s) => s.id === id) ?? steps[0]
  }, [steps, selectedStepId])

  const progressSummary = useMemo(
    () => resolvePathwayProgress(roadmap, gapReport),
    [roadmap, gapReport]
  )

  const tabLoading = Boolean(activeInterest && pathway.loadingByInterest[activeInterest])
  const hasCachedPathway = Boolean(activeInterest && pathway.pathwaysByInterest[activeInterest])
  const hasAnyGapReport = pathway.interests.some((i) => Boolean(pathway.getGapReport(i)))
  const loading = tabLoading && !hasCachedPathway && !hasAnyGapReport
  const inlineTabLoading = tabLoading && !hasCachedPathway && Boolean(gapReport)

  const needsAnalysis =
    pathway.interests.length > 0 &&
    Boolean(activeInterest) &&
    !gapReport &&
    !tabLoading

  const setSelectedStepId = useCallback(
    (stepId) => {
      if (activeInterest) pathway.setSelectedStepId(activeInterest, stepId)
    },
    [activeInterest, pathway]
  )

  const savePlanStep = useCallback(
    (stepId, fields) => {
      if (!activeInterest || !pathwayRecord?.pathwayId) return
      pathway.scheduleStepSave(activeInterest, pathwayRecord.pathwayId, {
        id: stepId,
        ...fields,
      })
    },
    [activeInterest, pathway, pathwayRecord?.pathwayId]
  )

  const setStepStatus = useCallback(
    (stepId, status) => {
      savePlanStep(stepId, { status })
    },
    [savePlanStep]
  )

  const savePlanFields = useCallback(
    async (fields) => {
      const stepId = selectedStep?.id
      if (!activeInterest || !stepId) return
      await pathway.savePlanNow(activeInterest, stepId, fields)
    },
    [activeInterest, pathway, selectedStep?.id]
  )

  const curatedResources = gapReport?.curatedResources ?? []
  const filteredResources = useMemo(() => {
    if (!resourcesSkillFilter) return curatedResources
    const needle = resourcesSkillFilter.toLowerCase()
    return curatedResources.filter(
      (r) =>
        r.skillName?.toLowerCase() === needle ||
        r.skillName?.toLowerCase().includes(needle) ||
        needle.includes(r.skillName?.toLowerCase() ?? '')
    )
  }, [curatedResources, resourcesSkillFilter])

  return {
    loading,
    tabLoading,
    loadingByInterest: pathway.loadingByInterest,
    inlineTabLoading,
    error: pathway.error,
    saveError: pathway.saveError,
    needsAnalysis,
    needsAnalysisEmpty: pathway.interests.length === 0,
    pathway: pathwayRecord,
    roadmap: roadmap ? { ...roadmap, progressSummary } : null,
    progressSummary,
    steps,
    gapReport,
    interests: pathway.interests,
    activeInterest,
    setActiveInterest: pathway.setActiveInterest,
    targetRole: activeInterest,
    selectedStep,
    selectedStepId,
    setSelectedStepId,
    savePlanStep,
    savePlanFields,
    planSaving: pathway.planSaving,
    setStepStatus,
    regenerateForRole: pathway.regenerateForRole,
    curatedResources: filteredResources,
    resourcesSkillFilter,
    setResourcesSkillFilter,
  }
}
