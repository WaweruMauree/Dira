import { classifyJob, isRemoteLocationString, REMOTE_LOCATION_RE } from './classifyJob'

function getFilterMeta(job) {
  const raw = job.raw
  if (typeof raw === 'object' && raw && raw.filterMeta && typeof raw.filterMeta === 'object') {
    return {
      careerStage: raw.filterMeta.careerStage ?? 'unknown',
      arrangement: raw.filterMeta.arrangement ?? 'unknown',
    }
  }
  return classifyJob(job)
}

function jobLocationHaystack(job) {
  return `${job.location ?? ''} ${job.title ?? ''} ${job.description ?? ''}`.toLowerCase()
}

function matchesLocation(job, value) {
  const v = (value ?? '').trim()
  if (!v) return true
  if (v === 'remote') {
    const loc = job.location ?? ''
    return isRemoteLocationString(loc) || REMOTE_LOCATION_RE.test(jobLocationHaystack(job))
  }
  const loc = (job.location ?? '').toLowerCase()
  return loc.includes(v.toLowerCase())
}

function matchesCareerStages(job, stages) {
  if (!stages?.length) return true
  const { careerStage } = getFilterMeta(job)
  return stages.includes(careerStage)
}

function matchesArrangements(job, arrangements) {
  if (!arrangements?.length) return true
  const { arrangement } = getFilterMeta(job)
  return arrangements.includes(arrangement)
}

export function filterJobs(jobs, filters) {
  const location = filters?.location ?? ''
  const careerStages = filters?.careerStages ?? []
  const arrangements = filters?.arrangements ?? []

  return jobs.filter(
    (job) =>
      matchesLocation(job, location) &&
      matchesCareerStages(job, careerStages) &&
      matchesArrangements(job, arrangements)
  )
}

export const DEFAULT_JOB_FEED_FILTERS = {
  location: '',
  careerStages: [],
  arrangements: [],
}

export function collectLocationOptions(jobs) {
  const seen = new Set()
  const options = []
  for (const job of jobs ?? []) {
    const loc = (job.location ?? '').trim()
    if (!loc || isRemoteLocationString(loc)) continue
    if (seen.has(loc)) continue
    seen.add(loc)
    options.push(loc)
  }
  return options.sort((a, b) => a.localeCompare(b))
}
