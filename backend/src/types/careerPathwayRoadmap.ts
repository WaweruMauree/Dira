import { z } from 'zod'

export const pathwayStepStatusSchema = z.enum(['not_started', 'in_progress', 'complete'])

export const pathwayStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(1),
  skillName: z.string().min(1),
  skillId: z.number().int().nullable(),
  title: z.string().min(1),
  description: z.string().optional(),
  suggestedDurationWeeks: z.number().int().min(1).max(52).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  upskillActions: z.string(),
  completionKpi: z.string(),
  status: pathwayStepStatusSchema,
  aiSuggested: z.boolean().optional(),
})

export const roadmapDataSchema = z.object({
  schemaVersion: z.literal(1),
  targetRole: z.string().min(1),
  pathwayRoleId: z.number().int().nullable(),
  sourceAnalysisId: z.number().int().nullable(),
  generatedAt: z.string(),
  progressSummary: z.object({
    completedSteps: z.number().int().min(0),
    totalSteps: z.number().int().min(0),
    percent: z.number().int().min(0).max(100),
  }),
  steps: z.array(pathwayStepSchema).min(1),
})

export type PathwayStep = z.infer<typeof pathwayStepSchema>
export type RoadmapData = z.infer<typeof roadmapDataSchema>

export function computeProgressSummary(steps: PathwayStep[]): RoadmapData['progressSummary'] {
  const totalSteps = steps.length
  const completedSteps = steps.filter((s) => s.status === 'complete').length
  const percent = totalSteps === 0 ? 0 : Math.round((completedSteps / totalSteps) * 100)
  return { completedSteps, totalSteps, percent }
}

export function mergePathwaySteps(
  existing: PathwayStep[],
  updates: Partial<PathwayStep> & { id: string }[]
): PathwayStep[] {
  const byId = new Map(updates.map((u) => [u.id, u]))
  return existing.map((step) => {
    const patch = byId.get(step.id)
    if (!patch) return step
    return { ...step, ...patch, id: step.id, order: step.order }
  })
}
