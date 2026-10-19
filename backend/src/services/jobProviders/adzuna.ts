import { env } from '../../config/env.js'
import type { UserJobInput } from '../../types/jobs.js'
import { stripHtml } from './normalize.js'

type AdzunaResult = {
  id?: string
  title?: string
  company?: { display_name?: string }
  description?: string
  location?: { display_name?: string }
  redirect_url?: string
  contract_type?: string
  salary_min?: number
  salary_max?: number
  created?: string
  category?: { label?: string }
}

export function isAdzunaConfigured(): boolean {
  return Boolean(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY && env.ADZUNA_COUNTRY)
}

export async function fetchAdzuna(query: string): Promise<UserJobInput[]> {
  if (!isAdzunaConfigured()) return []
  const country = env.ADZUNA_COUNTRY.toLowerCase()
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`)
  url.searchParams.set('app_id', env.ADZUNA_APP_ID)
  url.searchParams.set('app_key', env.ADZUNA_APP_KEY)
  url.searchParams.set('results_per_page', '15')
  url.searchParams.set('what', query.slice(0, 100))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Adzuna request failed (${res.status})`)
  const json = (await res.json()) as { results?: AdzunaResult[] }
  return (json.results ?? []).map((job) => ({
    externalId: String(job.id ?? job.redirect_url ?? crypto.randomUUID()),
    source: 'adzuna',
    title: job.title || 'Untitled role',
    organisation: job.company?.display_name ?? null,
    description: stripHtml(job.description),
    location: job.location?.display_name ?? null,
    url: job.redirect_url ?? null,
    employmentType: job.contract_type ?? null,
    experienceLevel: null,
    salaryMin: job.salary_min ?? null,
    salaryMax: job.salary_max ?? null,
    salaryCurrency: null,
    salaryPeriod: null,
    publishedAt: job.created ?? null,
    tags: job.category?.label ? [job.category.label] : [],
    raw: job as Record<string, unknown>,
  }))
}
