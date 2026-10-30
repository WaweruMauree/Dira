import { executeWebSearch } from './webSearch'
import { executeListJobs } from './linkedinJobSearch'
import { executeSaveOpportunity } from './saveOpportunity'
import { executeMapPathway } from './mapPathway'
import { executeAnalyzeSkillsGap } from './analyzeSkillsGap'
import { executeProfileLookup } from './profileLookup'
import { executeBuildCv } from './buildCv'
import { executeCvBuilder } from './cvBuilder'
import { executeSalaryEstimator } from './salaryEstimator'
import { executeAnalyzeUploadedFile } from './analyzeUploadedFile'
import { executeExportMarkdownDocument } from './exportMarkdownDocument'

export type ClientToolContext = {
  profileContext?: Record<string, unknown>
  attachments?: Array<{ name?: string; text?: string; kind?: string; mime?: string }>
}

export async function executeClientTool(
  name: string,
  input: Record<string, unknown>,
  token: string | null,
  ctx?: ClientToolContext
): Promise<unknown> {
  switch (name) {
    case 'webSearch':
      return executeWebSearch(input, token)
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
    case 'cvBuilder':
      return executeCvBuilder(input, token)
    case 'salaryEstimator':
      return executeSalaryEstimator(input, token)
    case 'analyzeUploadedFile':
      return executeAnalyzeUploadedFile(input, token, ctx)
    case 'exportMarkdownDocument':
      return executeExportMarkdownDocument(input)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
