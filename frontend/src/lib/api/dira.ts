import { apiFetch } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { AgentMode, MePayload, Paged, UserJobInput } from './types'

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
  me(token: string) {
    return apiFetch<{ data: MePayload }>(API_ENDPOINTS.me, { token })
  },
  patchMe(token: string, body: Record<string, unknown>) {
    return apiFetch<{ data: MePayload['profile'] }>(API_ENDPOINTS.me, { method: 'PATCH', token, body })
  },
  onboarding(token: string, body: Record<string, unknown>) {
    return apiFetch(API_ENDPOINTS.onboarding, { method: 'POST', token, body })
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
    return apiFetch(API_ENDPOINTS.skillsGapAnalyze, { method: 'POST', token, body })
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
