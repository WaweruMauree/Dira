import type { AgentChatRequest, AgentChatResponse } from './types'
import { API_ENDPOINTS } from './endpoints'
import { apiFetch, AgentApiError } from './client'
import { mockAgentResponse } from './agent.mock'

export { AgentApiError }

export function shouldUseMockAgent(): boolean {
  return import.meta.env.VITE_USE_MOCK_AGENT === 'true'
}

export async function sendAgentMessage(
  req: AgentChatRequest,
  token?: string | null
): Promise<AgentChatResponse> {
  if (shouldUseMockAgent()) {
    return mockAgentResponse(req)
  }

  return apiFetch<AgentChatResponse>(API_ENDPOINTS.agentChat, {
    method: 'POST',
    body: req,
    token,
  })
}
