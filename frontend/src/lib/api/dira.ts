import { apiFetch } from './client'
import { API_ENDPOINTS } from './endpoints'
import type { AgentMode, MePayload, Paged, UserJobInput } from './types'

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
    return apiFetch<Paged<Array<{ id: string; title: string; mode: AgentMode; updated_at: string; preview: string | null }>>>(
      API_ENDPOINTS.conversations,
      { token }
    )
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
  listMessages(token: string, id: string) {
    return apiFetch<{ data: Array<Record<string, unknown>> }>(`${API_ENDPOINTS.conversations}/${id}/messages`, { token })
  },
  upsertUserJobs(token: string, jobs: UserJobInput[]) {
    return apiFetch<{ data: Array<{ id: number } & UserJobInput> }>(API_ENDPOINTS.userJobs, {
      method: 'POST',
      token,
      body: { jobs },
    })
  },
  patchUserJob(token: string, id: number, body: { saved?: boolean }) {
    return apiFetch(`${API_ENDPOINTS.userJobs}/${id}`, { method: 'PATCH', token, body })
  },
  createCv(token: string, body: { title?: string; targetJobId?: number; resume: Record<string, unknown> }) {
    return apiFetch<{ data: Record<string, unknown> }>(API_ENDPOINTS.cvs, { method: 'POST', token, body })
  },
  createSalaryEstimate(token: string, body: Record<string, unknown>) {
    return apiFetch(API_ENDPOINTS.salaryEstimates, { method: 'POST', token, body })
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
}
