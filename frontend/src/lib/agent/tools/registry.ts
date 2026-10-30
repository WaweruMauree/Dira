import type { AgentMode, AgentModeConfig, ToolName } from '@/lib/api/types'

export const AGENT_MODES: Record<AgentMode, AgentModeConfig> = {
  general: {
    label: 'Career Assistant',
    route: '/chat',
    tools: ['webSearch', 'cvBuilder', 'salaryEstimator', 'analyzeUploadedFile', 'exportMarkdownDocument'],
    description: 'General career questions, CVs, and salary research.',
  },
  career_guidance: {
    label: 'Skills Analysis',
    route: '/skills-analysis',
    tools: ['analyzeSkillsGap', 'webSearch', 'profileLookup', 'mapPathway'],
    description: 'Compare your skills to industry roles and find learning resources.',
  },
  job_aggregation: {
    label: 'Job Search',
    route: '/jobs',
    tools: ['listJobs', 'webSearch', 'saveOpportunity', 'salaryEstimator'],
    description: 'Find and save job opportunities.',
  },
}

export function getModeConfig(mode: AgentMode): AgentModeConfig {
  return AGENT_MODES[mode]
}

export function getModeFromPath(pathname: string): AgentMode | null {
  if (pathname.startsWith('/skills-analysis')) return 'career_guidance'
  if (pathname.startsWith('/career-guidance')) return 'career_guidance'
  if (pathname.startsWith('/jobs')) return 'job_aggregation'
  if (pathname.startsWith('/chat')) return 'general'
  return null
}

export function getNewChatPath(mode: AgentMode): string {
  return `${AGENT_MODES[mode].route}/new`
}

export function getChatPath(mode: AgentMode, chatId: string): string {
  return `${AGENT_MODES[mode].route}/${chatId}`
}

export type { ToolName, AgentMode }
