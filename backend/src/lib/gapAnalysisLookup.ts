import type { SupabaseClient } from '@supabase/supabase-js'
import { throwIfError } from './helpers.js'
import { normalizeTargetRole } from './targetRole.js'

const RECENT_ANALYSES_LIMIT = 30

export async function findLatestGapAnalysisForProfile(
  supabase: SupabaseClient,
  profileId: number,
  targetRole: string | null | undefined
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('skills_gap_analyses')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(targetRole ? RECENT_ANALYSES_LIMIT : 1)

  throwIfError(error)
  const rows = data ?? []

  if (!targetRole?.trim()) {
    return (rows[0] as Record<string, unknown>) ?? null
  }

  const needle = normalizeTargetRole(targetRole)
  const match = rows.find((row) => {
    const role = row.target_role
    return typeof role === 'string' && normalizeTargetRole(role) === needle
  })
  return (match as Record<string, unknown>) ?? null
}
