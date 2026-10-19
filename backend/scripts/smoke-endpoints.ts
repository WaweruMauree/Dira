import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const BASE = `http://localhost:${process.env.PORT ?? 4000}/api/v1`
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY are required')
  process.exit(1)
}

type CallOpts = {
  method?: string
  token?: string | null
  body?: unknown
  expect?: number | number[]
}

async function call(path: string, opts: CallOpts = {}) {
  const expect = opts.expect ?? [200, 201, 204]
  const allowed = Array.isArray(expect) ? expect : [expect]
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
  let json: unknown = null
  if (res.status !== 204) {
    try {
      json = await res.json()
    } catch {
      json = null
    }
  }
  const ok = allowed.includes(res.status)
  const line = `${opts.method ?? 'GET'} ${path} → ${res.status}`
  if (!ok) {
    console.error(`FAIL ${line}`, json)
    throw new Error(`Unexpected status for ${path}: ${res.status}`)
  }
  console.log(`OK   ${line}`)
  return { status: res.status, json }
}

async function main() {
  const health = await fetch(`${BASE.replace('/api/v1', '')}/api/v1/health`)
  if (!health.ok) throw new Error('Health check failed — is the API running?')
  console.log('OK   GET /health')

  await call('/me', { expect: 401 })

  const protectedGets = [
    '/me',
    '/conversations',
    '/user-jobs',
    '/cvs',
    '/salary-estimates',
    '/skills',
    '/pathway-roles',
    '/pathway-edges',
    '/learning-resources',
    '/opportunity-sources',
    '/opportunities',
    '/students',
    '/student-profiles',
    '/student-skills',
    '/career-interests',
    '/profiles',
    '/admins',
    '/match-results',
    '/skills-gap-analyses',
    '/career-pathways',
    '/profile-interactions',
    '/user-interactions',
    '/saved-opportunities',
    '/community-submissions',
    '/audit-logs',
    '/aggregation-runs',
    '/pathways/map?targetRole=Data%20Analyst',
  ]
  for (const path of protectedGets) {
    await call(path, { expect: 401 })
  }
  await call('/onboarding', { method: 'POST', body: {}, expect: 401 })
  await call('/onboarding/programme-suggestions', { method: 'POST', body: {}, expect: 401 })
  await call('/agent/chat', { method: 'POST', body: {}, expect: 401 })
  await call('/skills-gap/analyze', { method: 'POST', body: { targetRole: 'x' }, expect: 401 })
  await call('/career-pathways/current', { expect: 401 })
  await call('/career-pathways/generate', { method: 'POST', body: {}, expect: 401 })
  await call('/career-pathways/1', { method: 'PATCH', body: { steps: [] }, expect: 401 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const stamp = Date.now()
  const email = process.env.SMOKE_EMAIL || `dira.smoke.${stamp}@gmail.com`
  const password = process.env.SMOKE_PASSWORD || 'SmokeTest!23456'

  let token: string | undefined
  if (process.env.SMOKE_EMAIL) {
    const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
    token = signIn.session?.access_token
  } else {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: 'Smoke Student', role: 'STUDENT' } },
    })
    if (signUpError) {
      console.error(
        '\nCould not obtain a JWT from live Supabase Auth.\n' +
          `Reason: ${signUpError.message}\n` +
          'Disable Authentication → Providers → Email → Confirm email for local testing,\n' +
          'or set SMOKE_EMAIL and SMOKE_PASSWORD to a confirmed student account.\n' +
          'Unauthenticated route sweep already passed (401 on every protected endpoint).'
      )
      process.exit(1)
    }
    token = signUpData.session?.access_token
    if (!token) {
      const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        console.error(
          '\nCould not obtain a JWT from live Supabase Auth.\n' +
            `Reason: ${signInError.message}\n` +
            'Disable Authentication → Providers → Email → Confirm email for local testing,\n' +
            'or set SMOKE_EMAIL and SMOKE_PASSWORD to a confirmed student account.\n' +
            'Unauthenticated route sweep already passed (401 on every protected endpoint).'
        )
        process.exit(1)
      }
      token = signIn.session?.access_token
    }
  }
  if (!token) throw new Error('No access token')

  await call('/me', { token })
  await call('/onboarding/programme-suggestions', {
    token,
    method: 'POST',
    body: {
      courseCatalogId: 'OTHER',
      programmeLabel: 'Musical Arts',
    },
  })
  await call('/onboarding', {
    token,
    method: 'POST',
    body: {
      course: 'Bachelor of Business Information Technology (BBIT)',
      courseCatalogId: 'BBIT',
      yearOfStudy: 3,
      technicalSkills: { Python: 4, SQL: 3, 'Custom Smoke Skill': 4 },
      softSkills: { Communication: 4, Teamwork: 3 },
      careerInterests: ['Data Science', 'Custom Interest From Smoke'],
      careerReadiness: 'PREPARING',
    },
  })
  const me = await call('/me', { token })
  const meData = (me.json as {
    data: {
      profile: { id: string }
      student: { id: number } | null
      studentProfile: { profile_id: number } | null
    }
  }).data
  await call('/me', { token, method: 'PATCH', body: { full_name: 'Smoke Student Updated' } })
  await call(`/profiles/${meData.profile.id}`, { token })
  if (meData.student) {
    await call(`/students/${meData.student.id}`, { token })
    await call(`/students/${meData.student.id}`, {
      token,
      method: 'PATCH',
      body: { course: 'BBIT' },
      expect: [200, 403, 404],
    })
  }
  if (meData.studentProfile) {
    await call(`/student-profiles/${meData.studentProfile.profile_id}`, { token })
    await call(`/student-profiles/${meData.studentProfile.profile_id}`, {
      token,
      method: 'PATCH',
      body: { bio: 'Smoke bio' },
    })
  }

  const conv = await call('/conversations', {
    token,
    method: 'POST',
    body: { mode: 'general', title: 'Smoke chat' },
  })
  const convId = (conv.json as { data: { id: string } }).data.id
  await call('/conversations', { token })
  await call(`/conversations/${convId}`, { token })
  await call(`/conversations/${convId}`, { token, method: 'PATCH', body: { title: 'Smoke chat 2' } })
  await call(`/conversations/${convId}/messages`, { token })
  await call(`/conversations/${convId}/messages`, {
    token,
    method: 'POST',
    body: { role: 'user', content: 'hello' },
  })

  const job = await call('/user-jobs', {
    token,
    method: 'POST',
    body: {
      jobs: [
        {
          externalId: `smoke-${stamp}`,
          source: 'jobicy',
          title: 'Data Analyst Intern',
          organisation: 'Smoke Co',
          description: 'Test job',
          location: 'Remote',
          url: 'https://example.com/job',
          employmentType: 'Intern',
          experienceLevel: 1,
          tags: ['sql'],
          raw: { id: stamp },
        },
      ],
    },
  })
  const jobId = (job.json as { data: Array<{ id: number }> }).data[0]?.id
  await call('/user-jobs', { token })
  if (jobId) {
    await call(`/user-jobs/${jobId}`, { token })
    await call(`/user-jobs/${jobId}`, { token, method: 'PATCH', body: { saved: true } })
  }

  const cv = await call('/cvs', {
    token,
    method: 'POST',
    body: {
      title: 'Smoke Resume',
      resume: { basics: { name: 'Smoke Student', email } },
    },
  })
  const cvId = (cv.json as { data: { id: number } }).data.id
  await call('/cvs', { token })
  await call(`/cvs/${cvId}`, { token })
  await call(`/cvs/${cvId}`, { token, method: 'PATCH', body: { title: 'Smoke Resume 2' } })

  const salary = await call('/salary-estimates', {
    token,
    method: 'POST',
    body: { query: 'data analyst', location: 'Remote', currency: 'USD', min: 10000, median: 20000, max: 30000, sampleSize: 5, source: 'himalayas' },
  })
  const salaryId = (salary.json as { data: { id: number } }).data.id
  await call('/salary-estimates', { token })
  await call(`/salary-estimates/${salaryId}`, { token })

  const listGets = [
    '/skills',
    '/pathway-roles',
    '/pathway-edges',
    '/learning-resources',
    '/opportunity-sources',
    '/opportunities',
    '/students',
    '/student-profiles',
    '/student-skills',
    '/career-interests',
    '/profiles',
    '/admins',
    '/match-results',
    '/skills-gap-analyses',
    '/career-pathways',
    '/profile-interactions',
    '/user-interactions',
    '/saved-opportunities',
    '/community-submissions',
    '/audit-logs',
    '/aggregation-runs',
  ]
  const listed: Record<string, unknown> = {}
  for (const path of listGets) {
    listed[path] = (await call(path, { token, expect: [200, 403] })).json
  }

  function firstKey(path: string, keys: string[]) {
    const rows = (listed[path] as { data?: Array<Record<string, unknown>> } | undefined)?.data
    const row = rows?.[0]
    if (!row) return null
    for (const key of keys) {
      if (row[key] != null) return row[key] as number | string
    }
    return null
  }

  const skillId = firstKey('/skills', ['skill_id'])
  const roleId = firstKey('/pathway-roles', ['role_id'])
  const edgeId = firstKey('/pathway-edges', ['id'])
  const resourceId = firstKey('/learning-resources', ['id'])
  const sourceId = firstKey('/opportunity-sources', ['source_id'])
  const oppId = firstKey('/opportunities', ['opportunity_id'])
  const studentSkillId = firstKey('/student-skills', ['id'])
  const interestId = firstKey('/career-interests', ['id'])

  if (skillId) await call(`/skills/${skillId}`, { token })
  if (roleId) {
    await call(`/pathway-roles/${roleId}`, { token })
    await call(`/pathway-roles/${roleId}/skills`, { token })
  }
  if (edgeId) await call(`/pathway-edges/${edgeId}`, { token })
  if (resourceId) await call(`/learning-resources/${resourceId}`, { token })
  if (sourceId) await call(`/opportunity-sources/${sourceId}`, { token })
  if (oppId) {
    await call(`/opportunities/${oppId}`, { token })
    await call(`/opportunities/${oppId}/skills`, { token })
  }
  if (studentSkillId) await call(`/student-skills/${studentSkillId}`, { token })
  if (interestId) await call(`/career-interests/${interestId}`, { token })

  if (meData.studentProfile) {
    await call('/profile-interactions', {
      token,
      method: 'POST',
      body: {
        profile_id: meData.studentProfile.profile_id,
        action: 'VIEWED',
        target_type: 'opportunity',
        target_id: Number(oppId ?? 1),
      },
      expect: [201, 400, 403],
    })
    if (roleId) {
      await call('/career-pathways', {
        token,
        method: 'POST',
        body: {
          profile_id: meData.studentProfile.profile_id,
          target_role_id: roleId,
          roadmap_data: { steps: ['Learn SQL', 'Build a portfolio'] },
        },
        expect: [201, 400, 403],
      })
    }
  }
  if (oppId) {
    await call('/user-interactions', {
      token,
      method: 'POST',
      body: { opportunity_id: oppId, action: 'VIEW' },
      expect: [201, 400, 403],
    })
    await call('/saved-opportunities', {
      token,
      method: 'POST',
      body: { opportunity_id: oppId },
      expect: [201, 400, 403, 409],
    })
  }

  await call('/pathways/map?targetRole=Data%20Analyst', { token, expect: [200, 404] })
  await call('/skills-gap/analyze', {
    token,
    method: 'POST',
    body: { targetRole: 'Data Analyst' },
    expect: [201, 404],
  })

  const submission = await call('/community-submissions', {
    token,
    method: 'POST',
    body: { title: 'Smoke internship', organisation: 'Test Org', type: 'INTERNSHIP', industry: 'TECH' },
  })
  const subId = (submission.json as { data: { submission_id: number } }).data.submission_id
  await call(`/community-submissions/${subId}`, { token })

  await call('/skills', {
    token,
    method: 'POST',
    body: { name: `SmokeSkill${stamp}`, category: 'TECH' },
    expect: [201, 400, 403],
  })

  for (const proxy of ['/tools/web-search?q=test', '/tools/jobs?q=test', '/tools/salary-estimate?q=test']) {
    const missing = await fetch(`${BASE.replace('/api/v1', '')}/api/v1${proxy}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (missing.status === 404 || missing.status === 401) {
      console.log(`OK   GET ${proxy.split('?')[0]} is not a proxy (${missing.status})`)
    } else {
      throw new Error(`Expected ${proxy} to be absent, got ${missing.status}`)
    }
  }

  const agent = await call('/agent/chat', {
    token,
    method: 'POST',
    body: {
      conversationId: convId,
      mode: 'general',
      userMessage: 'Reply with exactly the word PONG and do not call tools.',
      tools: [
        {
          name: 'webSearch',
          description: 'Search the web',
          parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
        },
      ],
    },
    expect: [200, 503],
  })
  if (agent.status === 200) {
    const payload = agent.json as { status: string; toolCalls?: unknown[]; conversationId: string }
    if (payload.status === 'requires_action') {
      await call('/agent/chat', {
        token,
        method: 'POST',
        body: {
          conversationId: convId,
          mode: 'general',
          tools: [{ name: 'webSearch', description: 'Search the web', parameters: { type: 'object', properties: { query: { type: 'string' } } } }],
          toolResults: [
            {
              toolCallId: (payload.toolCalls as Array<{ id: string }>)[0]?.id,
              name: 'webSearch',
              output: { results: [{ title: 'Pong', url: 'https://example.com', snippet: 'test', source: 'exa' }] },
            },
          ],
        },
      })
    }
  }

  const { data: otherSignUp } = await supabase.auth.signUp({
    email: `dira.smoke.b.${stamp}@gmail.com`,
    password,
    options: { data: { full_name: 'Smoke Other', role: 'STUDENT' } },
  })
  const otherToken = otherSignUp.session?.access_token
  if (otherToken) {
    if (jobId) {
      await call(`/user-jobs/${jobId}`, { token: otherToken, expect: [403, 404] })
    }
    await call(`/conversations/${convId}`, { token: otherToken, expect: [403, 404] })
    await call(`/cvs/${cvId}`, { token: otherToken, expect: [403, 404] })
    console.log('OK   RLS isolation (second user cannot read first user rows)')
  } else {
    console.log('SKIP RLS isolation (second user has no session — email confirmation required)')
  }

  if (jobId) await call(`/user-jobs/${jobId}`, { token, method: 'DELETE', expect: 204 })
  await call(`/cvs/${cvId}`, { token, method: 'DELETE', expect: 204 })
  await call(`/conversations/${convId}`, { token, method: 'DELETE', expect: 204 })

  console.log('\nSmoke tests passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
