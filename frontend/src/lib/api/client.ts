import { getAgentApiUrl } from './endpoints'

export class AgentApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'AgentApiError'
    this.status = status
    this.body = body
  }
}

type FetchOpts = {
  method?: string
  body?: unknown
  token?: string | null
  headers?: Record<string, string>
}

export async function apiFetch<T = unknown>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = opts
  const url = getAgentApiUrl(path)
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (!res.ok) {
    let errorBody: { message?: string } = { message: res.statusText }
    try {
      errorBody = (await res.json()) as { message?: string }
    } catch {
      /* ignore */
    }
    throw new AgentApiError(errorBody.message || 'Request failed', res.status, errorBody)
  }

  if (res.status === 204) return null as T
  return (await res.json()) as T
}

export async function checkAgentHealth(token?: string | null) {
  return apiFetch(API_HEALTH, { token })
}

const API_HEALTH = '/api/v1/health'
