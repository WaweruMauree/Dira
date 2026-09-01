import OpenAI from 'openai'
import { env } from '../config/env.js'

export function hasOpenRouter(): boolean {
  return Boolean(env.OPENROUTER_API_KEY)
}

export function createOpenRouterClient(): OpenAI {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': env.OPENROUTER_SITE_URL,
      'X-Title': 'Dira',
    },
  })
}
