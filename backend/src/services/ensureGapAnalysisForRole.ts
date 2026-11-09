import type { SupabaseClient } from '@supabase/supabase-js'
import { findLatestGapAnalysisForProfile } from '../lib/gapAnalysisLookup.js'
import { buildSkillsAnalysisReport } from './skillsAnalysisReport.js'

export type EnsuredGapAnalysis = {
  analysis: Record<string, unknown>
  report: Record<string, unknown>
  methodology: Record<string, unknown>
  created: boolean
}

export async function ensureGapAnalysisForRole(
  supabase: SupabaseClient,
  profileId: number,
  targetRole: string
): Promise<EnsuredGapAnalysis> {
  const trimmed = targetRole.trim()
  const existing = await findLatestGapAnalysisForProfile(supabase, profileId, trimmed)
  if (existing) {
    const report = reportFromAnalysisRow(existing)
    return {
      analysis: existing,
      report,
      methodology:
        typeof existing.methodology === 'object' && existing.methodology
          ? (existing.methodology as Record<string, unknown>)
          : {},
      created: false,
    }
  }

  const built = await buildSkillsAnalysisReport(supabase, profileId, trimmed)
  const report = built.report as Record<string, unknown>
  const methodology = built.methodology as Record<string, unknown>

  const legacyRequired =
    (report.skills as Array<{ skillId: number; name: string }> | undefined)?.map((s) => ({
      skill_id: s.skillId,
      name: s.name,
    })) ?? []
  const gaps = (report.gaps as string[]) ?? []
  const prioritisedPlan = (report.prioritisedPlan as unknown[]) ?? []

  const insertRow: Record<string, unknown> = {
    profile_id: profileId,
    required_skills: legacyRequired,
    gaps,
    prioritised_plan: prioritisedPlan,
    report,
    methodology,
    target_role: trimmed,
  }

  const pr = report.pathwayRole as { roleId?: number } | null | undefined
  if (pr?.roleId) insertRow.pathway_role_id = pr.roleId

  const { data: saved, error: saveError } = await supabase
    .from('skills_gap_analyses')
    .insert(insertRow)
    .select('*')
    .single()

  if (saveError) {
    console.warn('[ensureGapAnalysisForRole] Could not persist analysis:', saveError.message, saveError.code)
    return {
      analysis: { target_role: trimmed, report, methodology },
      report,
      methodology,
      created: true,
    }
  }

  return {
    analysis: saved as Record<string, unknown>,
    report,
    methodology,
    created: true,
  }
}

function reportFromAnalysisRow(row: Record<string, unknown>): Record<string, unknown> {
  const report = row.report
  if (typeof report === 'object' && report !== null) return report as Record<string, unknown>
  return {
    targetRole: row.target_role,
    prioritisedPlan: row.prioritised_plan,
    gaps: row.gaps,
  }
}
