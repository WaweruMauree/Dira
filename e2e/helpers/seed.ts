import { createClient } from '@supabase/supabase-js'
import { onboardingProfile, studentCredentials } from '../fixtures/test-data'

export type PendingOpportunitySeed = {
  approveTitle: string
  rejectTitle: string
  approveId?: number
  rejectId?: number
}

function serviceClient() {
  const url = process.env.SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for seed helpers')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

async function resolveSourceId(supabase: ReturnType<typeof serviceClient>): Promise<number> {
  const { data, error } = await supabase
    .from('opportunity_sources')
    .select('source_id')
    .order('source_id', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (data?.source_id) return data.source_id as number

  const { data: inserted, error: insertErr } = await supabase
    .from('opportunity_sources')
    .insert({
      name: `E2E Source ${Date.now()}`,
      source_type: 'INSTITUTIONAL',
      url_or_path: 'https://example.com/e2e',
      config: { import_type: 'manual' },
    })
    .select('source_id')
    .single()
  if (insertErr) throw insertErr
  return inserted.source_id as number
}

export async function seedPendingOpportunities(
  approveTitle: string,
  rejectTitle: string
): Promise<PendingOpportunitySeed> {
  const supabase = serviceClient()
  const sourceId = await resolveSourceId(supabase)

  const { data: rows, error } = await supabase
    .from('opportunities')
    .insert([
      {
        source_id: sourceId,
        title: approveTitle,
        organisation: 'E2E Org',
        description: 'Playwright moderation approve case',
        status: 'PENDING',
      },
      {
        source_id: sourceId,
        title: rejectTitle,
        organisation: 'E2E Org',
        description: 'Playwright moderation reject case',
        status: 'PENDING',
      },
    ])
    .select('opportunity_id, title')

  if (error) throw error

  const approve = rows?.find((r) => r.title === approveTitle)
  const reject = rows?.find((r) => r.title === rejectTitle)

  return {
    approveTitle,
    rejectTitle,
    approveId: approve?.opportunity_id as number | undefined,
    rejectId: reject?.opportunity_id as number | undefined,
  }
}

export async function studentCanListApprovedOpportunity(title: string, accessToken: string): Promise<boolean> {
  const base = process.env.VITE_AGENT_API_URL?.trim() || 'http://localhost:5173'
  const url = `${base.replace(/\/$/, '')}/api/v1/opportunities?status=APPROVED&limit=50`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return false
  const json = (await res.json()) as { data?: Array<{ title?: string }> }
  return (json.data ?? []).some((row) => row.title === title)
}

export async function getStudentAccessToken(email: string, password: string): Promise<string> {
  const url = process.env.VITE_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim()
  const anon = process.env.VITE_SUPABASE_ANON_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim()
  if (!url || !anon) throw new Error('Supabase anon credentials missing for token fetch')

  const supabase = createClient(url, anon, { auth: { persistSession: false } })
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session?.access_token) {
    throw error ?? new Error('Could not sign in student for API check')
  }
  return data.session.access_token
}

function agentApiBase() {
  return (
    process.env.VITE_AGENT_API_URL?.trim() ||
    process.env.AGENT_API_URL?.trim() ||
    'http://localhost:4000'
  ).replace(/\/$/, '')
}

/** Restore thesis onboarding fixture so T3 and T4 run deterministically across suite re-runs. */
export async function resetStudentOnboardingProfile() {
  const token = await getStudentAccessToken(studentCredentials.email, studentCredentials.password)
  const res = await fetch(`${agentApiBase()}/api/v1/me/student-profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      yearOfStudy: onboardingProfile.yearOfStudy,
      careerInterests: onboardingProfile.careerInterests,
      technicalSkills: onboardingProfile.technicalSkills,
      softSkills: onboardingProfile.softSkills,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`resetStudentOnboardingProfile failed (${res.status}): ${body.slice(0, 300)}`)
  }
}

export async function reactivateStudentByEmail(email: string) {
  const supabase = serviceClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (error) throw error
  if (!profile?.id) return

  await supabase.from('profiles').update({ status: 'ACTIVE' }).eq('id', profile.id)
}