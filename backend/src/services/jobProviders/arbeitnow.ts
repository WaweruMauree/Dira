import type { UserJobInput } from '../../types/jobs.js'
import { asText, mapExperienceLevel, stripHtml, toIsoDate } from './normalize.js'

type ArbeitnowJob = {
  slug?: string
  company_name?: string
  title?: string
  description?: string
  remote?: boolean
  url?: string
  tags?: string[]
  job_types?: string[]
  location?: string
  created_at?: number
}

export function mapArbeitnow(job: ArbeitnowJob): UserJobInput {
  return {
    externalId: String(job.slug ?? job.url ?? crypto.randomUUID()),
    source: 'arbeitnow',
    title: job.title || 'Untitled role',
    organisation: job.company_name ?? null,
    description: stripHtml(job.description),
    location: job.remote ? 'Remote' : job.location ?? null,
    url: job.url ?? null,
    employmentType: asText(job.job_types) || null,
    experienceLevel: mapExperienceLevel(job.job_types),
    publishedAt: toIsoDate(job.created_at),
    tags: job.tags ?? [],
    raw: job as Record<string, unknown>,
  }
}

export async function fetchArbeitnowFiltered(query: string): Promise<UserJobInput[]> {
  const res = await fetch('https://www.arbeitnow.com/api/job-board-api')
  if (!res.ok) throw new Error(`Arbeitnow request failed (${res.status})`)
  const json = (await res.json()) as { data?: ArbeitnowJob[] }
  const q = query.toLowerCase()
  const filtered = (json.data ?? []).filter((job) => {
    const hay = `${job.title ?? ''} ${job.description ?? ''} ${(job.tags ?? []).join(' ')}`.toLowerCase()
    return !q || q.split(/\s+/).some((term) => term.length > 2 && hay.includes(term))
  })
  return filtered.slice(0, 10).map(mapArbeitnow)
}
