import { Briefcase } from 'lucide-react'
import { fetchJobicy } from '../providers/jobicy'
import { fetchHimalayas } from '../providers/himalayas'
import { fetchRemotive } from '../providers/remotive'
import { fetchArbeitnow } from '../providers/arbeitnow'
import { diraApi } from '@/lib/api/dira'
import type { ClientToolDefinition, UserJobInput } from '@/lib/api/types'

export const listJobsTool = {
  name: 'listJobs',
  label: 'Job List',
  icon: Briefcase,
  runningLabel: 'Searching job boards...',
  completeLabel: 'Jobs loaded',
}

export const linkedinJobSearchTool = listJobsTool

export const listJobsDefinition: ClientToolDefinition = {
  name: 'listJobs',
  description: 'Search remote and entry-level jobs from Jobicy and Himalayas (Remotive/Arbeitnow as fallback). Then store them for this student.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      location: { type: 'string' },
      employmentType: { type: 'string' },
    },
    required: ['query'],
  },
}

export async function executeListJobs(input: Record<string, unknown>, token: string | null) {
  const query = String(input.query ?? '')
  const location = input.location ? String(input.location) : undefined
  const collected: UserJobInput[] = []
  const errors: string[] = []

  const attempts = [
    () => fetchHimalayas(query),
    () => fetchJobicy(query, location),
    () => fetchRemotive(query),
    () => fetchArbeitnow(),
  ]

  for (const attempt of attempts) {
    try {
      const rows = await attempt()
      collected.push(...rows)
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err))
    }
  }

  const unique = new Map<string, UserJobInput>()
  for (const job of collected) {
    unique.set(`${job.source}:${job.externalId}`, job)
  }
  const jobs = [...unique.values()].slice(0, 25)

  let stored: unknown = null
  if (token && jobs.length > 0) {
    const res = await diraApi.upsertUserJobs(token, jobs)
    stored = res.data
  }

  return {
    count: jobs.length,
    jobs: (stored as UserJobInput[] | null) ?? jobs,
    errors: errors.length ? errors : undefined,
  }
}
