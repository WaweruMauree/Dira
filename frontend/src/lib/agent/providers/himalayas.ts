import type { UserJobInput } from '@/lib/api/types'
import { asText, mapExperienceLevel, stripHtml, toIsoDate } from './normalize'

type HimalayasJob = {
  guid?: string
  title?: string
  excerpt?: string
  companyName?: string
  employmentType?: string
  minSalary?: number | null
  maxSalary?: number | null
  salaryPeriod?: string
  currency?: string
  seniority?: unknown
  locationRestrictions?: unknown
  categories?: unknown
  description?: string
  pubDate?: unknown
  applicationLink?: string
}

export function mapHimalayas(job: HimalayasJob): UserJobInput {
  return {
    externalId: String(job.guid ?? job.applicationLink ?? crypto.randomUUID()),
    source: 'himalayas',
    title: job.title || 'Untitled role',
    organisation: job.companyName ?? null,
    description: stripHtml(job.description || job.excerpt),
    location: (() => {
      const loc = asText(job.locationRestrictions) || 'Remote'
      return loc.length > 150 ? `${loc.slice(0, 149)}…` : loc
    })(),
    url: job.applicationLink ?? null,
    employmentType: job.employmentType ?? null,
    experienceLevel: mapExperienceLevel(job.seniority),
    salaryMin: job.minSalary ?? null,
    salaryMax: job.maxSalary ?? null,
    salaryCurrency: job.currency ?? null,
    salaryPeriod: job.salaryPeriod ?? null,
    publishedAt: toIsoDate(job.pubDate),
    tags: Array.isArray(job.categories) ? job.categories.map(asText) : [],
    raw: job as Record<string, unknown>,
  }
}

export async function fetchHimalayas(query: string): Promise<UserJobInput[]> {
  const url = new URL('https://himalayas.app/jobs/api/search')
  url.searchParams.set('q', query)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Himalayas request failed (${res.status})`)
  const json = (await res.json()) as { jobs?: HimalayasJob[] }
  return (json.jobs ?? []).map(mapHimalayas)
}
