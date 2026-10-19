import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import dotenv from 'dotenv'

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(backendRoot, '.env') })

const trimStringDefault = (fallback: string) =>
  z
    .string()
    .optional()
    .transform((s) => (s ?? fallback).trim())

const envSchema = z.object({
  NODE_ENV: trimStringDefault('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: trimStringDefault('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1).transform((s) => s.trim()),
  SUPABASE_SERVICE_ROLE_KEY: trimStringDefault(''),
  ADZUNA_APP_ID: trimStringDefault(''),
  ADZUNA_APP_KEY: trimStringDefault(''),
  ADZUNA_COUNTRY: trimStringDefault('gb'),
  OPENROUTER_API_KEY: trimStringDefault(''),
  OPENROUTER_MODEL: trimStringDefault('openai/gpt-4o-mini'),
  OPENROUTER_RUBRIC_MODEL: trimStringDefault(''),
  OPENROUTER_SITE_URL: trimStringDefault('http://localhost:5173'),
  EXA_API_KEY: trimStringDefault(''),
  PATHWAY_SKIP_LLM: trimStringDefault(''),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = {
  ...parsed.data,
  pathwaySkipLlm: parsed.data.PATHWAY_SKIP_LLM === 'true' || parsed.data.PATHWAY_SKIP_LLM === '1',
}
