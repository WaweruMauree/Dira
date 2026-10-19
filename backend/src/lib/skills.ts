import { env } from '../config/env.js'
import { createServiceClient } from './supabase.js'
import { throwIfError } from './helpers.js'
import { HttpError } from '../middleware/error.js'

type SkillCategory = 'TECH' | 'SOFT'

function requireServiceClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new HttpError(
      503,
      'Skill catalog updates require SUPABASE_SERVICE_ROLE_KEY in backend/.env.'
    )
  }
  return createServiceClient()
}

export async function ensureSkillIds(
  technicalSkills: Record<string, number>,
  softSkills: Record<string, number>
): Promise<Map<string, number>> {
  const categoryByName = new Map<string, SkillCategory>()
  for (const name of Object.keys(technicalSkills)) {
    categoryByName.set(name, 'TECH')
  }
  for (const name of Object.keys(softSkills)) {
    if (!categoryByName.has(name)) {
      categoryByName.set(name, 'SOFT')
    }
  }

  const uniqueNames = [...categoryByName.keys()]
  if (uniqueNames.length === 0) return new Map()

  const service = requireServiceClient()

  const { data: existing, error: selectError } = await service
    .from('skills')
    .select('skill_id, name')
    .in('name', uniqueNames)
  throwIfError(selectError)

  const nameToId = new Map((existing ?? []).map((s) => [s.name as string, s.skill_id as number]))

  const missing = uniqueNames.filter((n) => !nameToId.has(n))
  if (missing.length === 0) return nameToId

  const rows = missing.map((name) => ({
    name,
    category: categoryByName.get(name)!,
  }))
  const { data: upserted, error: upsertError } = await service
    .from('skills')
    .upsert(rows, { onConflict: 'name' })
    .select('skill_id, name')
  throwIfError(upsertError)
  for (const row of upserted ?? []) {
    nameToId.set(row.name as string, row.skill_id as number)
  }

  return nameToId
}
