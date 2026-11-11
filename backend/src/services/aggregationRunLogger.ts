import type { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '../lib/supabase.js'

export type JobProviderKey = 'himalayas' | 'jobicy' | 'adzuna' | 'arbeitnow'

export type AggregationRunStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL'

const PROVIDER_SOURCE_META: Record<
  JobProviderKey,
  { name: string; url: string }
> = {
  himalayas: { name: 'Himalayas Jobs API', url: 'https://himalayas.app' },
  jobicy: { name: 'Jobicy Jobs API', url: 'https://jobicy.com' },
  adzuna: { name: 'Adzuna Jobs API', url: 'https://www.adzuna.com' },
  arbeitnow: { name: 'Arbeitnow Jobs API', url: 'https://www.arbeitnow.com' },
}

const sourceIdCache = new Map<JobProviderKey, number>()

async function lookupSourceId(
  service: SupabaseClient,
  providerKey: JobProviderKey
): Promise<number | null> {
  const cached = sourceIdCache.get(providerKey)
  if (cached != null) return cached

  const name = PROVIDER_SOURCE_META[providerKey].name
  const { data, error } = await service
    .from('opportunity_sources')
    .select('source_id')
    .eq('name', name)
    .maybeSingle()

  if (error) {
    console.warn('[aggregationRunLogger] lookup failed for', providerKey, error.message)
    return null
  }
  if (!data?.source_id) return null

  const id = Number(data.source_id)
  sourceIdCache.set(providerKey, id)
  return id
}

async function ensureSourceId(
  service: SupabaseClient,
  providerKey: JobProviderKey
): Promise<number | null> {
  const existing = await lookupSourceId(service, providerKey)
  if (existing != null) return existing

  const meta = PROVIDER_SOURCE_META[providerKey]
  const { data, error } = await service
    .from('opportunity_sources')
    .insert({
      name: meta.name,
      source_type: 'FORMAL',
      url_or_path: meta.url,
      config: { provider: providerKey, kind: 'job_api' },
    })
    .select('source_id')
    .single()

  if (error) {
    const afterRace = await lookupSourceId(service, providerKey)
    if (afterRace != null) return afterRace
    console.warn('[aggregationRunLogger] could not create source for', providerKey, error.message)
    return null
  }

  const id = Number(data.source_id)
  sourceIdCache.set(providerKey, id)
  return id
}

/** Ensures catalog rows exist (migration 004 optional). */
export async function ensureJobApiOpportunitySources(): Promise<void> {
  try {
    const service = createServiceClient()
    for (const key of Object.keys(PROVIDER_SOURCE_META) as JobProviderKey[]) {
      await ensureSourceId(service, key)
    }
  } catch (err) {
    console.warn(
      '[aggregationRunLogger] ensure sources skipped',
      err instanceof Error ? err.message : err
    )
  }
}

export async function recordAggregationRun(opts: {
  providerKey: JobProviderKey
  itemsFound: number
  errors: string[]
  status: AggregationRunStatus
}): Promise<void> {
  try {
    const service = createServiceClient()
    const sourceId = await ensureSourceId(service, opts.providerKey)
    if (sourceId == null) return

    const finishedAt = new Date().toISOString()
    const startedAt = finishedAt

    const { error } = await service.from('aggregation_runs').insert({
      source_id: sourceId,
      started_at: startedAt,
      finished_at: finishedAt,
      status: opts.status,
      items_found: opts.itemsFound,
      errors: opts.errors,
    })

    if (error) {
      console.warn('[aggregationRunLogger] insert failed', error.message)
    }
  } catch (err) {
    console.warn('[aggregationRunLogger] could not record run', err instanceof Error ? err.message : err)
  }
}
