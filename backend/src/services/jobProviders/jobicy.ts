import type { UserJobInput } from '../../types/jobs.js'
import { asText, mapExperienceLevel, stripHtml, toIsoDate } from './normalize.js'

type JobicyJob = {
  id?: string | number
  url?: string
  jobTitle?: string
  companyName?: string
  jobIndustry?: unknown
  jobType?: unknown
  jobGeo?: string
  jobLevel?: string
  jobExcerpt?: string
  jobDescription?: string
  pubDate?: string
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: string
  salaryPeriod?: string
}

export function mapJobicy(job: JobicyJob): UserJobInput {
  return {
    externalId: String(job.id ?? job.url ?? crypto.randomUUID()),
    source: 'jobicy',
    title: job.jobTitle || 'Untitled role',
    organisation: job.companyName ?? null,
    description: stripHtml(job.jobDescription || job.jobExcerpt),
    location: job.jobGeo ?? null,
    url: job.url ?? null,
    employmentType: asText(job.jobType) || null,
    experienceLevel: mapExperienceLevel(job.jobLevel),
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    salaryCurrency: job.salaryCurrency ?? null,
    salaryPeriod: job.salaryPeriod ?? null,
    publishedAt: toIsoDate(job.pubDate),
    tags: Array.isArray(job.jobIndustry) ? job.jobIndustry.map(asText) : [],
    raw: job as Record<string, unknown>,
  }
}

export async function fetchJobicy(query: string, location?: string): Promise<UserJobInput[]> {
  const url = new URL('https://jobicy.com/api/v2/remote-jobs')
  url.searchParams.set('count', '15')
  if (query) url.searchParams.set('tag', query.slice(0, 50))
  if (location) url.searchParams.set('geo', location.toLowerCase().replace(/\s+/g, '-'))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Jobicy request failed (${res.status})`)
  const json = (await res.json()) as { jobs?: JobicyJob[] }
  return (json.jobs ?? []).map(mapJobicy)
}
