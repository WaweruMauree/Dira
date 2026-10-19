import { apiFetch } from './client'
import { API_ENDPOINTS } from './endpoints'
import type {
  AdminAggregationRun,
  AdminAuditLogRow,
  AdminPendingReview,
  AdminStudentRow,
  AdminUsageReport,
  AgentMode,
  CareerPathwayRecord,
  CareerPathwayStep,
  MePayload,
  Paged,
  SkillsAnalysisReport,
  UserJobInput,
} from './types'

function queryString(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function resourceClient(base: string) {
  return {
    list<T = Record<string, unknown>>(
      token: string,
      params?: Record<string, string | number | boolean | undefined>
    ) {
      return apiFetch<Paged<T[]>>(`${base}${queryString(params)}`, { token })
    },
    get<T = Record<string, unknown>>(token: string, id: string | number) {
      return apiFetch<{ data: T }>(`${base}/${id}`, { token })
    },
    create<T = Record<string, unknown>>(token: string, body: unknown) {
      return apiFetch<{ data: T }>(base, { method: 'POST', token, body })
    },
    patch<T = Record<string, unknown>>(token: string, id: string | number, body: unknown) {
      return apiFetch<{ data: T }>(`${base}/${id}`, { method: 'PATCH', token, body })
    },
    remove(token: string, id: string | number) {
      return apiFetch(`${base}/${id}`, { method: 'DELETE', token })
    },
  }
}

export const diraApi = {
  getHealth() {
    return apiFetch<{
      status: string
      features?: { openRouter?: boolean; exa?: boolean }
    }>(API_ENDPOINTS.health)
  },
  checkSignupAvailability(body: { email?: string; phone?: string }) {
    return apiFetch<{ emailTaken?: boolean; phoneTaken?: boolean }>(API_ENDPOINTS.authAvailability, {
      method: 'POST',
      body,
    })
  },
  fetchSkillProficiencyRubrics(
    token: string,
    body: {
      courseCatalogId: string
      courseLabel?: string
      items: Array<{ skillName: string; category: 'TECHNICAL' | 'SOFT' }>
    }
  ) {
    return apiFetch<{
      rubrics: Record<
        string,
        {
          skillName: string
          category: 'TECHNICAL' | 'SOFT'
          levels: Record<'1' | '3' | '5', { summary: string; criteria: string[] }>
        }
      >
    }>(API_ENDPOINTS.skillsProficiencyRubrics, { method: 'POST', token, body })
  },
  me(token: string) {
    return apiFetch<{ data: MePayload }>(API_ENDPOINTS.me, { token })
  },
  patchMe(token: string, body: Record<string, unknown>) {
    return apiFetch<{ data: MePayload['profile'] }>(API_ENDPOINTS.me, { method: 'PATCH', token, body })
  },
  patchStudentProfileBio(token: string, bio: string) {
    return apiFetch<{ data: Record<string, unknown> }>(API_ENDPOINTS.meStudentProfile, {
      method: 'PATCH',
      token,
      body: { bio },
    })
  },
  patchStudentProfile(token: string, body: Record<string, unknown>) {
    return apiFetch<{ data: Record<string, unknown> }>(API_ENDPOINTS.meStudentProfile, {
      method: 'PATCH',
      token,
      body,
    })
  },
  onboarding(token: string, body: Record<string, unknown>) {
    return apiFetch<{
      data: {
        student: Record<string, unknown>
        studentProfile: Record<string, unknown>
        onboarded: boolean
      }
    }>(API_ENDPOINTS.onboarding, { method: 'POST', token, body })
  },
  fetchProgrammeSuggestions(
    token: string,
    body: { courseCatalogId: string; programmeLabel: string }
  ) {
    return apiFetch<{
      data: {
        technicalSkills: string[]
        softSkills: string[]
        careerInterests: string[]
        programmeSector?: string | null
        source: 'ai' | 'fallback'
      }
    }>(API_ENDPOINTS.onboardingProgrammeSuggestions, { method: 'POST', token, body })
  },
  listConversations(token: string) {
    return apiFetch<
      Paged<Array<{ id: string; title: string; mode: AgentMode; updated_at: string; preview: string | null }>>
    >(API_ENDPOINTS.conversations, { token })
  },
  createConversation(token: string, body: { mode: AgentMode; title?: string; id?: string }) {
    return apiFetch<{ data: { id: string; mode: AgentMode; title: string; updated_at: string; preview: string | null } }>(
      API_ENDPOINTS.conversations,
      { method: 'POST', token, body }
    )
  },
  getConversation(token: string, id: string) {
    return apiFetch<{ data: { id: string; title: string; mode: AgentMode; updated_at: string; preview: string | null } }>(
      `${API_ENDPOINTS.conversations}/${id}`,
      { token }
    )
  },
  patchConversation(token: string, id: string, body: Record<string, unknown>) {
    return apiFetch(`${API_ENDPOINTS.conversations}/${id}`, { method: 'PATCH', token, body })
  },
  deleteConversation(token: string, id: string) {
    return apiFetch(`${API_ENDPOINTS.conversations}/${id}`, { method: 'DELETE', token })
  },
  listMessages(token: string, id: string) {
    return apiFetch<{ data: Array<Record<string, unknown>> }>(`${API_ENDPOINTS.conversations}/${id}/messages`, {
      token,
    })
  },
  createMessage(token: string, id: string, body: Record<string, unknown>) {
    return apiFetch(`${API_ENDPOINTS.conversations}/${id}/messages`, { method: 'POST', token, body })
  },
  listUserJobs(token: string, params?: Record<string, string | number | boolean | undefined>) {
    return resourceClient(API_ENDPOINTS.userJobs).list(token, params)
  },
  getJobFeed(token: string, params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch<Paged<Array<Record<string, unknown>>>>(`${API_ENDPOINTS.userJobs}/feed${queryString(params)}`, {
      token,
    })
  },
  recommendJobs(token: string, force = false) {
    const qs = force ? '?force=true' : ''
    return apiFetch<{ data: Array<Record<string, unknown>>; cached?: boolean }>(
      `${API_ENDPOINTS.userJobs}/recommend${qs}`,
      { method: 'POST', token, body: {} }
    )
  },
  upsertUserJobs(token: string, jobs: UserJobInput[]) {
    return apiFetch<{ data: Array<{ id: number } & UserJobInput> }>(API_ENDPOINTS.userJobs, {
      method: 'POST',
      token,
      body: { jobs },
    })
  },
  getUserJob(token: string, id: number) {
    return resourceClient(API_ENDPOINTS.userJobs).get(token, id)
  },
  patchUserJob(token: string, id: number, body: { saved?: boolean }) {
    return apiFetch(`${API_ENDPOINTS.userJobs}/${id}`, { method: 'PATCH', token, body })
  },
  listJobViews(token: string) {
    return apiFetch<{ data: Array<Record<string, unknown>> }>(`${API_ENDPOINTS.userJobs}/views`, { token })
  },
  recordJobView(token: string, jobId: number) {
    return apiFetch<{ data: Record<string, unknown> }>(`${API_ENDPOINTS.userJobs}/${jobId}/view`, {
      method: 'POST',
      token,
      body: {},
    })
  },
  deleteUserJob(token: string, id: number) {
    return resourceClient(API_ENDPOINTS.userJobs).remove(token, id)
  },
  listCvs(token: string) {
    return resourceClient(API_ENDPOINTS.cvs).list(token)
  },
  createCv(token: string, body: { title?: string; targetJobId?: number; resume: Record<string, unknown> }) {
    return apiFetch<{ data: Record<string, unknown> }>(API_ENDPOINTS.cvs, { method: 'POST', token, body })
  },
  getCv(token: string, id: number) {
    return resourceClient(API_ENDPOINTS.cvs).get(token, id)
  },
  patchCv(token: string, id: number, body: Record<string, unknown>) {
    return resourceClient(API_ENDPOINTS.cvs).patch(token, id, body)
  },
  deleteCv(token: string, id: number) {
    return resourceClient(API_ENDPOINTS.cvs).remove(token, id)
  },
  listSalaryEstimates(token: string) {
    return resourceClient(API_ENDPOINTS.salaryEstimates).list(token)
  },
  createSalaryEstimate(token: string, body: Record<string, unknown>) {
    return apiFetch(API_ENDPOINTS.salaryEstimates, { method: 'POST', token, body })
  },
  getSalaryEstimate(token: string, id: number) {
    return resourceClient(API_ENDPOINTS.salaryEstimates).get(token, id)
  },
  mapPathway(token: string, targetRole: string) {
    return apiFetch(`${API_ENDPOINTS.pathwaysMap}?targetRole=${encodeURIComponent(targetRole)}`, { token })
  },
  analyzeSkillsGap(token: string, body: { targetRole?: string; opportunityId?: number }) {
    return apiFetch<{ data: SkillsAnalysisReport }>(API_ENDPOINTS.skillsGapAnalyze, {
      method: 'POST',
      token,
      body,
    })
  },
  listSkillsGapAnalyses(token: string, params?: Record<string, string | number | boolean | undefined>) {
    return apiFetch<Paged<Array<Record<string, unknown>>>>(`${API_ENDPOINTS.skillsGapAnalysesList}${queryString(params)}`, {
      token,
    })
  },
  getLatestSkillsAnalysis(token: string, targetRole?: string) {
    const qs = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : ''
    return apiFetch<{ data: SkillsAnalysisReport | null }>(`${API_ENDPOINTS.skillsGapLatest}${qs}`, { token })
  },
  getCurrentCareerPathway(token: string, targetRole?: string) {
    const qs = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : ''
    return apiFetch<{ data: CareerPathwayRecord | null }>(
      `${API_ENDPOINTS.careerPathwaysCurrent}${qs}`,
      { token }
    )
  },
  generateCareerPathway(token: string, body?: { targetRole?: string }) {
    return apiFetch<{ data: CareerPathwayRecord }>(API_ENDPOINTS.careerPathwaysGenerate, {
      method: 'POST',
      token,
      body: body ?? {},
    })
  },
  patchCareerPathway(
    token: string,
    pathwayId: number,
    body: { steps?: Array<Partial<CareerPathwayStep> & { id: string }> }
  ) {
    return apiFetch<{ data: CareerPathwayRecord }>(`${API_ENDPOINTS.careerPathways}/${pathwayId}`, {
      method: 'PATCH',
      token,
      body,
    })
  },
  adminGetDashboardSummary(token: string) {
    return apiFetch<{
      data: {
        totalStudents: number
        pendingListings: number
        flaggedItems: number
        activeSessions: number
      }
    }>(API_ENDPOINTS.adminDashboardSummary, { token })
  },
  adminGetPendingReviews(token: string) {
    return apiFetch<{ data: AdminPendingReview[] }>(API_ENDPOINTS.adminPendingReviews, { token })
  },
  adminApproveReview(token: string, entityType: string, id: number) {
    return apiFetch<{ data: { ok: boolean } }>(
      `/api/v1/admin/dashboard/reviews/${entityType}/${id}/approve`,
      { method: 'POST', token }
    )
  },
  adminRejectReview(token: string, entityType: string, id: number) {
    return apiFetch<{ data: { ok: boolean } }>(
      `/api/v1/admin/dashboard/reviews/${entityType}/${id}/reject`,
      { method: 'POST', token }
    )
  },
  adminListStudents(token: string, params?: Record<string, string | number | undefined>) {
    return apiFetch<Paged<AdminStudentRow[]>>(`${API_ENDPOINTS.adminStudents}${queryString(params)}`, { token })
  },
  adminPatchStudentStatus(token: string, userId: string, status: 'ACTIVE' | 'SUSPENDED') {
    return apiFetch(`${API_ENDPOINTS.adminStudents}/${userId}/status`, {
      method: 'PATCH',
      token,
      body: { status },
    })
  },
  adminListAuditLogs(token: string, params?: Record<string, string | number | undefined>) {
    return apiFetch<Paged<AdminAuditLogRow[]>>(`${API_ENDPOINTS.adminAuditLogs}${queryString(params)}`, { token })
  },
  adminGetUsageReport(token: string) {
    return apiFetch<{ data: AdminUsageReport }>(API_ENDPOINTS.adminUsageReport, { token })
  },
  adminGetSystemPerformance(token: string, params?: Record<string, string | number | undefined>) {
    return apiFetch<Paged<AdminAggregationRun[]>>(
      `${API_ENDPOINTS.adminSystemPerformance}${queryString(params)}`,
      { token }
    )
  },
  saveCatalogOpportunity(token: string, opportunityId: number) {
    return apiFetch(API_ENDPOINTS.savedOpportunities, {
      method: 'POST',
      token,
      body: { opportunity_id: opportunityId },
    })
  },
  listOpportunitySkills(token: string, opportunityId: number) {
    return apiFetch(`${API_ENDPOINTS.opportunities}/${opportunityId}/skills`, { token })
  },
  listPathwayRoleSkills(token: string, roleId: number) {
    return apiFetch(`${API_ENDPOINTS.pathwayRoles}/${roleId}/skills`, { token })
  },
  profiles: resourceClient(API_ENDPOINTS.profiles),
  students: resourceClient(API_ENDPOINTS.students),
  studentProfiles: resourceClient(API_ENDPOINTS.studentProfiles),
  studentSkills: resourceClient(API_ENDPOINTS.studentSkills),
  careerInterests: resourceClient(API_ENDPOINTS.careerInterests),
  admins: resourceClient(API_ENDPOINTS.admins),
  skills: resourceClient(API_ENDPOINTS.skills),
  pathwayRoles: resourceClient(API_ENDPOINTS.pathwayRoles),
  pathwayEdges: resourceClient(API_ENDPOINTS.pathwayEdges),
  learningResources: resourceClient(API_ENDPOINTS.learningResources),
  opportunitySources: resourceClient(API_ENDPOINTS.opportunitySources),
  opportunities: resourceClient(API_ENDPOINTS.opportunities),
  communitySubmissions: resourceClient(API_ENDPOINTS.communitySubmissions),
  savedOpportunities: resourceClient(API_ENDPOINTS.savedOpportunities),
  matchResults: resourceClient(API_ENDPOINTS.matchResults),
  skillsGapAnalyses: resourceClient(API_ENDPOINTS.skillsGapAnalyses),
  careerPathways: resourceClient(API_ENDPOINTS.careerPathways),
  profileInteractions: resourceClient(API_ENDPOINTS.profileInteractions),
  userInteractions: resourceClient(API_ENDPOINTS.userInteractions),
  auditLogs: resourceClient(API_ENDPOINTS.auditLogs),
  aggregationRuns: resourceClient(API_ENDPOINTS.aggregationRuns),
}
