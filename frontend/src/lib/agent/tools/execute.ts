import { executeWebSearch } from './webSearch'
import { executeListJobs } from './linkedinJobSearch'
import { executeSaveOpportunity } from './saveOpportunity'
import { executeMapPathway } from './mapPathway'
import { executeAnalyzeSkillsGap } from './analyzeSkillsGap'
import { executeProfileLookup } from './profileLookup'
import { executeBuildCv } from './buildCv'
import { executeSalaryEstimator } from './salaryEstimator'

export async function executeClientTool(
  name: string,
  input: Record<string, unknown>,
  token: string | null
): Promise<unknown> {
  switch (name) {
    case 'webSearch':
      return executeWebSearch(input)
    case 'listJobs':
    case 'linkedinJobSearch':
      return executeListJobs(input, token)
    case 'saveOpportunity':
      return executeSaveOpportunity(input, token)
    case 'mapPathway':
      return executeMapPathway(input, token)
    case 'analyzeSkillsGap':
      return executeAnalyzeSkillsGap(input, token)
    case 'profileLookup':
      return executeProfileLookup(input, token)
    case 'buildCv':
      return executeBuildCv(input, token)
    case 'salaryEstimator':
      return executeSalaryEstimator(input, token)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
