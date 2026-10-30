import OpenAI, { APIError } from 'openai'
import { env } from '../config/env.js'
import { HttpError } from '../middleware/error.js'

export function hasOpenRouter(): boolean {
  return env.OPENROUTER_API_KEY.length > 0
}

export function assertOpenRouterConfigured(): void {
  if (!hasOpenRouter()) {
    throw new HttpError(
      503,
      'Skills analysis for custom roles requires OPENROUTER_API_KEY on the backend.'
    )
  }
}

export function createOpenRouterClient(): OpenAI {
  assertOpenRouterConfigured()
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': env.OPENROUTER_SITE_URL,
      'X-Title': 'Dira',
    },
  })
}

function openRouterErrorMessage(err: APIError): string {
  const nested = (err as { error?: { message?: string } }).error
  if (nested?.message && typeof nested.message === 'string') return nested.message
  return err.message || 'OpenRouter request failed'
}

/** Map OpenAI SDK errors from OpenRouter to HttpError for consistent API responses. */
export function mapOpenRouterError(err: unknown): HttpError {
  if (err instanceof APIError) {
    const detail = openRouterErrorMessage(err)
    if (err.status === 402) {
      return new HttpError(
        402,
        `${detail} Add credits at https://openrouter.ai/settings/credits or lower OPENROUTER_MAX_TOKENS in backend/.env.`
      )
    }
    if (err.status === 401 || err.status === 403) {
      return new HttpError(502, 'Invalid or unauthorized OpenRouter API key.')
    }
    if (err.status === 429) {
      return new HttpError(502, 'OpenRouter rate limit exceeded. Try again shortly.')
    }
    if (err.status != null && err.status >= 400 && err.status < 500) {
      return new HttpError(502, detail)
    }
    return new HttpError(502, detail)
  }
  if (err instanceof Error) {
    return new HttpError(502, err.message)
  }
  return new HttpError(502, 'OpenRouter request failed')
}
