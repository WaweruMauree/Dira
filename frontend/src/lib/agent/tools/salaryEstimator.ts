import { CircleDollarSign } from 'lucide-react'
import { fetchHimalayas } from '../providers/himalayas'
import { fetchAdzunaHistogram } from '../providers/adzuna'
import { diraApi } from '@/lib/api/dira'
import type { ClientToolDefinition } from '@/lib/api/types'

export const salaryEstimatorTool = {
  name: 'salaryEstimator',
  label: 'Salary Estimator',
  icon: CircleDollarSign,
  runningLabel: 'Estimating salary...',
  completeLabel: 'Salary estimated',
}

export const salaryEstimatorDefinition: ClientToolDefinition = {
  name: 'salaryEstimator',
  description: 'Estimate salary range for a role from Himalayas listings, optionally Adzuna histogram.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      location: { type: 'string' },
    },
    required: ['query'],
  },
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (!sorted.length) return null
  if (sorted.length % 2 === 0) return (sorted[mid - 1]! + sorted[mid]!) / 2
  return sorted[mid]!
}

export async function executeSalaryEstimator(input: Record<string, unknown>, token: string | null) {
  const query = String(input.query ?? '')
  const location = input.location ? String(input.location) : null
  if (!query) throw new Error('query is required')

  const jobs = await fetchHimalayas(query)
  const values: number[] = []
  let currency: string | null = null
  for (const job of jobs) {
    if (job.salaryMin != null) values.push(Number(job.salaryMin))
    if (job.salaryMax != null) values.push(Number(job.salaryMax))
    if (job.salaryCurrency) currency = job.salaryCurrency
  }

  const histogram = await fetchAdzunaHistogram(query)
  const estimate = {
    query,
    location,
    currency,
    min: values.length ? Math.min(...values) : null,
    median: median(values),
    max: values.length ? Math.max(...values) : null,
    sampleSize: jobs.length,
    source: histogram ? 'himalayas+adzuna' : 'himalayas',
    histogram: histogram?.histogram ?? {},
  }

  if (token) {
    await diraApi.createSalaryEstimate(token, estimate)
  }

  return estimate
}
