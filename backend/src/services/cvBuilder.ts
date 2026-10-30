import type { SupabaseClient } from '@supabase/supabase-js'
import { hasExaKey, searchExaDeep, type ExaSearchResult } from '../lib/exa.js'
import { createOpenRouterClient, hasOpenRouter, mapOpenRouterError } from '../lib/openrouter.js'
import { HttpError } from '../middleware/error.js'
import { throwIfError } from '../lib/helpers.js'
import { env } from '../config/env.js'
import { sanitizeAiPunctuation } from '../lib/copyStyle.js'

async function loadStudentBundle(supabase: SupabaseClient, userId: string) {
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  throwIfError(studentError)

  let studentProfile = null
  let skills: unknown[] = []
  let interests: unknown[] = []

  if (student) {
    const { data: sp, error: spError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('student_id', student.id)
      .maybeSingle()
    throwIfError(spError)
    studentProfile = sp

    if (sp) {
      const profileId = (sp as { profile_id: number }).profile_id
      const { data: skillRows, error: skillError } = await supabase
        .from('student_skills')
        .select('proficiency_level, skills (skill_id, name, category)')
        .eq('profile_id', profileId)
      throwIfError(skillError)
      skills = skillRows ?? []

      const { data: interestRows, error: interestError } = await supabase
        .from('career_interests')
        .select('area')
        .eq('profile_id', profileId)
      throwIfError(interestError)
      interests = interestRows ?? []
    }
  }

  return { student, studentProfile, skills, interests }
}

function uniqueSources(rows: ExaSearchResult[]) {
  const seen = new Set<string>()
  const out: Array<{ title: string; url: string }> = []
  for (const r of rows) {
    if (!r.url || seen.has(r.url)) continue
    seen.add(r.url)
    out.push({ title: r.title, url: r.url })
  }
  return out.slice(0, 8)
}

function buildProfileResume(
  profile: Record<string, unknown>,
  student: Record<string, unknown> | null,
  studentProfile: Record<string, unknown> | null,
  skills: unknown[],
  interests: unknown[],
  targetRole: string
) {
  const skillNames = skills
    .map((row) => {
      if (!row || typeof row !== 'object') return ''
      const r = row as { skills?: { name?: string } }
      return r.skills?.name ?? ''
    })
    .filter(Boolean)
  const interestAreas = interests
    .map((row) => {
      if (!row || typeof row !== 'object') return ''
      return String((row as { area?: string }).area ?? '')
    })
    .filter(Boolean)

  const fullName =
    String((profile as { full_name?: string }).full_name ?? '') ||
    String((profile as { username?: string }).username ?? 'Student')

  return {
    basics: {
      name: fullName,
      label: targetRole,
      summary: '',
    },
    education: [
      {
        institution: 'University',
        area: String(student?.course ?? ''),
        studyType: 'Bachelor',
      },
    ],
    skills: skillNames.map((name) => ({ name, level: 'intermediate' })),
    interests: interestAreas.map((name) => ({ name })),
    meta: {
      yearOfStudy: studentProfile?.year_of_study,
      careerGoal: studentProfile?.career_goal,
      careerReadiness: studentProfile?.career_readiness,
    },
  }
}

export async function runCvBuilder(opts: {
  supabase: SupabaseClient
  userId: string
  profile: Record<string, unknown>
  targetRole: string
  title?: string
  extraContext?: string
}) {
  if (!hasOpenRouter()) {
    throw new HttpError(503, 'OPENROUTER_API_KEY is not configured')
  }

  const { student, studentProfile, skills, interests } = await loadStudentBundle(
    opts.supabase,
    opts.userId
  )

  const role = opts.targetRole.trim()
  let research: ExaSearchResult[] = []
  if (hasExaKey()) {
    const q1 = await searchExaDeep(`sample CV resume ${role} university student`)
    const q2 = await searchExaDeep(`how to write CV ${role} structure sections examples`)
    research = [...q1, ...q2]
  }

  const researchBlock = research
    .map((r, i) => `${i + 1}. ${r.title} (${r.url})\n${r.excerpt || r.snippet}`)
    .join('\n\n')
    .slice(0, 12_000)

  const profileJson = JSON.stringify(
    {
      profile: opts.profile,
      student,
      studentProfile,
      skills,
      interests,
      targetRole: role,
      extraContext: opts.extraContext ?? '',
    },
    null,
    2
  ).slice(0, 10_000)

  const client = createOpenRouterClient()
  let markdown = ''
  try {
    const completion = await client.chat.completions.create({
      model: env.OPENROUTER_MODEL,
      max_tokens: env.OPENROUTER_MAX_TOKENS,
      temperature: 0.35,
      messages: [
        {
          role: 'system',
          content:
            'You write ATS-friendly CVs in markdown for university students. Use ONLY facts from the student profile JSON. Use web research for section structure and professional wording, not invented jobs or degrees. Include: name heading, professional summary, education, skills, projects or experience if present in profile, interests if relevant. No HTML. No fake download links.',
        },
        {
          role: 'user',
          content: `Target role: ${role}\n\nStudent profile JSON:\n${profileJson}\n\nWeb research excerpts:\n${researchBlock || '(none)'}`,
        },
      ],
    })
    markdown = sanitizeAiPunctuation(completion.choices[0]?.message?.content?.trim() ?? '')
  } catch (err) {
    throw mapOpenRouterError(err)
  }

  if (!markdown) {
    throw new HttpError(502, 'CV builder did not produce content')
  }

  const resume = buildProfileResume(
    opts.profile,
    student as Record<string, unknown> | null,
    studentProfile as Record<string, unknown> | null,
    skills,
    interests,
    role
  )
  resume.basics.summary = markdown.split('\n').slice(0, 3).join(' ').slice(0, 400)

  const docTitle = opts.title ?? `CV — ${role}`
  const { data: saved, error } = await opts.supabase
    .from('student_cvs')
    .insert({
      user_id: opts.userId,
      title: docTitle,
      target_job_id: null,
      resume,
    })
    .select('*')
    .single()
  throwIfError(error)

  const researchSources = uniqueSources(research)
  const safeFilename = docTitle.replace(/[^\w\s-]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60)

  return {
    title: docTitle,
    markdown,
    filename: `${safeFilename || 'cv'}.docx`,
    artifactType: 'document' as const,
    artifact: true,
    targetRole: role,
    saved,
    researchSources,
    resume,
  }
}
