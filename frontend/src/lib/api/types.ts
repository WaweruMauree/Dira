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
  | 'cvBuilder'
  | 'salaryEstimator'
  | 'analyzeUploadedFile'
  | 'exportMarkdownDocument'

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
  attachments?: Array<{
    name: string
    mime: string
    kind: 'image' | 'document'
    text?: string
    dataUrl?: string
    path?: string
    url?: string
  }>
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
    avatar_kind?: 'jazzicon' | 'upload' | null
    avatar_url?: string | null
    jazzicon_seed?: string | null
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

export type PathwayStepStatus = 'not_started' | 'in_progress' | 'complete'

export interface CareerPathwayStep {
  id: string
  order: number
  skillName: string
  skillId: number | null
  title: string
  description?: string
  suggestedDurationWeeks?: number
  startDate?: string | null
  endDate?: string | null
  upskillActions: string
  completionKpi: string
  status: PathwayStepStatus
  aiSuggested?: boolean
}

export interface CareerPathwayRoadmap {
  schemaVersion: 1
  targetRole: string
  pathwayRoleId: number | null
  sourceAnalysisId: number | null
  generatedAt: string
  progressSummary: {
    completedSteps: number
    totalSteps: number
    percent: number
  }
  steps: CareerPathwayStep[]
}

export interface CareerPathwayRecord {
  pathwayId: number
  profileId: number
  targetRoleId: number
  roadmapData: CareerPathwayRoadmap
  generatedAt: string
}

export interface SkillsAnalysisReport {
  targetRole: string
  pathwayRole: {
    roleId: number
    title: string
    level: string | null
    matchScore?: number
    matchMethod?: string
  } | null
  skills: Array<{
    skillId: number
    name: string
    category: string | null
    currentLevel: number | null
    currentLevelLabel: string
    requiredLevel: number
    requiredLevelLabel: string
    status: 'met' | 'upskill' | 'gap'
  }>
  gaps: string[]
  upskills: string[]
  strengths: string[]
  curatedResources: Array<{
    id: number
    title: string
    url: string
    source: string
    description: string | null
    skillId: number | null
    skillName: string | null
  }>
  agentSourcedResources?: Array<{
    skill: string
    query: string
    items: Array<{ title: string; url: string; snippet?: string | null }>
  }>
  agentSourcedResourcesMeta?: {
    unavailable?: boolean
    reason?: string
  }
  prioritisedPlan: Array<{
    order: number
    skill: string
    priority: string
    action: string
    estimatedTimeLabel?: string
  }>
  requiredLevel?: number
  requiredLevelLabel?: string
  methodology?: Record<string, unknown>
  saved?: Record<string, unknown>
}

export interface Paged<T> {
  data: T
  count?: number
  limit?: number
  offset?: number
}

export interface AdminPendingReview {
  id: number
  entityType: 'community_submission' | 'opportunity'
  title: string
  source: string
  flagReason: string
  createdAt: string
}

export interface AdminStudentRow {
  userId: string
  fullName: string | null
  username: string | null
  phoneNumber: string | null
  status: string
  course: string | null
  onboarded: boolean
  createdAt: string
}

export interface AdminAuditLogRow {
  log_id: number
  action: string
  target_entity: string | null
  target_id: number | null
  timestamp: string
  admin_id: number
}

export interface AdminUsageReport {
  totalStudents: number
  totalConversations: number
  conversationsLast30Days: number
  totalUserJobs: number
  totalSkillsAnalyses: number
  totalSavedOpportunities: number
}

export interface AdminAggregationRun {
  id: number
  started_at: string
  finished_at: string | null
  status: string
  items_found: number
  errors: unknown
  opportunity_sources: { name?: string } | null
}
