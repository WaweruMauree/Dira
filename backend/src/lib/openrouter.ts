import OpenAI from 'openai'
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
