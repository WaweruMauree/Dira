import type { UserJobInput } from '@/lib/api/types'
import { mapExperienceLevel, stripHtml, toIsoDate } from './normalize'

type RemotiveJob = {
  id?: number
  url?: string
  title?: string
  company_name?: string
  category?: string
  tags?: string[]
  job_type?: string
  publication_date?: string
  candidate_required_location?: string
  salary?: string
  description?: string
}

export function mapRemotive(job: RemotiveJob): UserJobInput {
  return {
    externalId: String(job.id ?? job.url ?? crypto.randomUUID()),
    source: 'remotive',
    title: job.title || 'Untitled role',
    organisation: job.company_name ?? null,
    description: stripHtml(job.description),
    location: job.candidate_required_location ?? null,
    url: job.url ?? null,
    employmentType: job.job_type ?? null,
    experienceLevel: mapExperienceLevel(job.job_type),
    salaryText: job.salary ?? null,
    publishedAt: toIsoDate(job.publication_date),
    tags: job.tags ?? (job.category ? [job.category] : []),
    raw: job as Record<string, unknown>,
  }
}

export async function fetchRemotive(query: string): Promise<UserJobInput[]> {
  const url = new URL('https://remotive.com/api/remote-jobs')
  url.searchParams.set('search', query)
  url.searchParams.set('limit', '20')
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Remotive request failed (${res.status})`)
  const json = (await res.json()) as { jobs?: RemotiveJob[] }
  return (json.jobs ?? []).map(mapRemotive)
}
