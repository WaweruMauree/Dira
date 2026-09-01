export type AgentMode = 'general' | 'career_guidance' | 'job_aggregation'

export type ToolName =
  | 'webSearch'
  | 'listJobs'
  | 'linkedinJobSearch'
  | 'saveOpportunity'
  | 'mapPathway'
  | 'analyzeSkillsGap'
  | 'profileLookup'
  | 'buildCv'
  | 'salaryEstimator'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolCalls?: ToolCallResult[]
  createdAt: string
}

export interface ToolCallResult {
  id?: string
  name: ToolName | string
  status: 'pending' | 'complete' | 'error'
  input?: Record<string, unknown>
  output?: unknown
}

export interface ClientToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface AgentChatRequest {
  conversationId?: string
  chatId?: string
  mode: AgentMode
  messages?: Pick<ChatMessage, 'role' | 'content'>[]
  userMessage?: string
  tools: Array<ToolName | ClientToolDefinition>
  toolResults?: Array<{
    toolCallId: string
    name: string
    output?: unknown
    error?: string
  }>
  profileContext?: Record<string, unknown>
}

export interface AgentChatResponse {
  conversationId: string
  message?: ChatMessage
  toolCalls?: ToolCallResult[]
  status: 'complete' | 'requires_action' | 'error'
  error?: string
}

export interface AgentModeConfig {
  label: string
  route: string
  tools: ToolName[]
  description: string
}

export interface ChatSummary {
  id: string
  title: string
  mode: AgentMode
  updatedAt: string
  preview: string
}

export interface UserJobInput {
  externalId: string
  source: string
  title: string
  organisation?: string | null
  description?: string | null
  location?: string | null
  url?: string | null
  employmentType?: string | null
  experienceLevel?: number | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  salaryPeriod?: string | null
  salaryText?: string | null
  publishedAt?: string | null
  tags?: string[]
  raw?: Record<string, unknown>
  saved?: boolean
}

export interface MePayload {
  profile: {
    id: string
    full_name: string | null
    username: string | null
    role: 'STUDENT' | 'ADMIN'
    status: 'ACTIVE' | 'SUSPENDED'
  }
  student: { id: number; user_id: string; course: string | null } | null
  studentProfile: {
    profile_id: number
    year_of_study: number | null
    career_readiness: string | null
    bio: string | null
    career_goal: string | null
    onboarded: boolean
  } | null
  skills: unknown[]
  interests: unknown[]
  onboarded: boolean
}

export interface Paged<T> {
  data: T
  count?: number
  limit?: number
  offset?: number
}
