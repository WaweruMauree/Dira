import type { UserJobInput } from '@/lib/api/types'
import { asText, mapExperienceLevel, stripHtml, toIsoDate } from './normalize'

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

export async function fetchArbeitnow(): Promise<UserJobInput[]> {
  const res = await fetch('https://www.arbeitnow.com/api/job-board-api')
  if (!res.ok) throw new Error(`Arbeitnow request failed (${res.status})`)
  const json = (await res.json()) as { data?: ArbeitnowJob[] }
  return (json.data ?? []).slice(0, 20).map(mapArbeitnow)
}
