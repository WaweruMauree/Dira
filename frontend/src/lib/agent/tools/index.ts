import { webSearchTool, webSearchDefinition } from './webSearch'
import { listJobsTool, listJobsDefinition, linkedinJobSearchTool } from './linkedinJobSearch'
import { saveOpportunityTool, saveOpportunityDefinition } from './saveOpportunity'
import { mapPathwayTool, mapPathwayDefinition } from './mapPathway'
import { analyzeSkillsGapTool, analyzeSkillsGapDefinition } from './analyzeSkillsGap'
import { profileLookupTool, profileLookupDefinition } from './profileLookup'
import { buildCvTool, buildCvDefinition } from './buildCv'
import { salaryEstimatorTool, salaryEstimatorDefinition } from './salaryEstimator'
import type { ClientToolDefinition, ToolName } from '@/lib/api/types'

export const TOOL_METADATA = {
  webSearch: webSearchTool,
  listJobs: listJobsTool,
  linkedinJobSearch: linkedinJobSearchTool,
  saveOpportunity: saveOpportunityTool,
  mapPathway: mapPathwayTool,
  analyzeSkillsGap: analyzeSkillsGapTool,
  profileLookup: profileLookupTool,
  buildCv: buildCvTool,
  salaryEstimator: salaryEstimatorTool,
}

export const TOOL_DEFINITIONS: Record<string, ClientToolDefinition> = {
  webSearch: webSearchDefinition,
  listJobs: listJobsDefinition,
  linkedinJobSearch: { ...listJobsDefinition, name: 'linkedinJobSearch' },
  saveOpportunity: saveOpportunityDefinition,
  mapPathway: mapPathwayDefinition,
  analyzeSkillsGap: analyzeSkillsGapDefinition,
  profileLookup: profileLookupDefinition,
  buildCv: buildCvDefinition,
  salaryEstimator: salaryEstimatorDefinition,
}

export function getToolMetadata(name: string) {
  return (
    TOOL_METADATA[name as ToolName] ?? {
      name,
      label: name,
      icon: null,
      runningLabel: 'Running tool...',
      completeLabel: 'Complete',
    }
  )
}

export function definitionsFor(names: ToolName[]): ClientToolDefinition[] {
  return names.map((name) => TOOL_DEFINITIONS[name]).filter(Boolean) as ClientToolDefinition[]
}
