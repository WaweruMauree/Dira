import type { SupabaseClient } from '@supabase/supabase-js'
import { MISSING_LEVEL_LABEL } from '../lib/copyStyle.js'
import { throwIfError } from '../lib/helpers.js'
import { fetchRequiredSkillsForRoleFromWeb } from './roleSkillsFromAgent.js'

export type SkillRowStatus = 'met' | 'upskill' | 'gap'

export type SkillAnalysisRow = {
  skillId: number
  name: string
  category: string | null
  currentLevel: number | null
  currentLevelLabel: string
  requiredLevel: number
  requiredLevelLabel: string
  status: SkillRowStatus
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner',
  3: 'Intermediate',
  5: 'Expert',
}

function levelLabel(level: number): string {
  return LEVEL_LABELS[level] ?? 'Intermediate'
}

export type PrioritisedPlanStep = {
  order: number
  skill: string
  priority: 'gap' | 'upskill'
  action: string
  estimatedTimeLabel: string
}

/** effortScore: higher = more work. Time ranges are indicative for self-paced learning. */
function estimateSkillEffort(row: SkillAnalysisRow): { effortScore: number; estimatedTimeLabel: string } {
  const req = row.requiredLevel
  if (row.status === 'gap') {
    if (req <= 1) return { effortScore: 30, estimatedTimeLabel: '~2-3 weeks' }
    if (req >= 5) return { effortScore: 90, estimatedTimeLabel: '~8-12 weeks' }
    return { effortScore: 60, estimatedTimeLabel: '~4-6 weeks' }
  }
  const cur = row.currentLevel ?? 1
  const delta = Math.max(0, req - cur)
  if (delta <= 2) return { effortScore: 25, estimatedTimeLabel: '~2-3 weeks' }
  if (delta <= 4) return { effortScore: 55, estimatedTimeLabel: '~4-6 weeks' }
  return { effortScore: 80, estimatedTimeLabel: '~6-8 weeks' }
}

function buildPrioritisedPlanFromSkills(skills: SkillAnalysisRow[]): PrioritisedPlanStep[] {
  return skills
    .filter((s) => s.status === 'gap' || s.status === 'upskill')
    .map((row) => {
      const { effortScore, estimatedTimeLabel } = estimateSkillEffort(row)
      const priority = row.status as 'gap' | 'upskill'
      return {
        skill: row.name,
        priority,
        action: priority === 'gap' ? `Learn ${row.name}` : `Improve ${row.name}`,
        effortScore,
        estimatedTimeLabel,
      }
    })
    .sort((a, b) => b.effortScore - a.effortScore)
    .map((step, i) => ({
      order: i + 1,
      skill: step.skill,
      priority: step.priority,
      action: step.action,
      estimatedTimeLabel: step.estimatedTimeLabel,
    }))
}

function requiredLevelForRole(pathwayLevel: string | null | undefined): number {
  switch (pathwayLevel) {
    case 'ENTRY':
      return 1
    case 'MID':
      return 3
    case 'SENIOR':
    case 'SPECIALIST':
      return 5
    default:
      return 3
  }
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function scoreRoleMatch(interest: string, title: string): number {
  const a = normalize(interest)
  const b = normalize(title)
  if (a === b) return 1000
  if (b.includes(a) || a.includes(b)) return 500
  const aWords = new Set(a.split(' ').filter((w) => w.length > 2))
  let overlap = 0
  for (const w of b.split(' ')) {
    if (aWords.has(w)) overlap += 1
  }
  return overlap * 40
}

export async function resolvePathwayRole(
  supabase: SupabaseClient,
  targetRole: string
): Promise<{ role_id: number; title: string; level: string | null; matchScore: number; matchMethod: string } | null> {
  const term = targetRole.trim()
  let roles: Array<{ role_id: number; title: string; level: string | null }> | null = null
  const { data: ilikeRoles, error } = await supabase
    .from('pathway_roles')
    .select('role_id, title, level')
    .ilike('title', `%${term}%`)
    .limit(24)
  throwIfError(error)
  roles = ilikeRoles ?? []
  if (roles.length === 0) {
    const { data: allRoles, error: allErr } = await supabase
      .from('pathway_roles')
      .select('role_id, title, level')
      .limit(100)
    throwIfError(allErr)
    roles = allRoles ?? []
  }
  if (!roles.length) return null

  let best = roles[0]!
  let bestScore = scoreRoleMatch(term, best.title as string)
  for (const r of roles) {
    const s = scoreRoleMatch(term, r.title as string)
    if (s > bestScore) {
      bestScore = s
      best = r
    }
  }

  const matchMethod =
    normalize(best.title as string) === normalize(term)
      ? 'exact_title_match'
      : bestScore >= 500
        ? 'partial_title_match'
        : 'keyword_overlap_ranking'

  return {
    role_id: best.role_id as number,
    title: best.title as string,
    level: (best.level as string | null) ?? null,
    matchScore: bestScore,
    matchMethod,
  }
}

const CATALOG_MIN_MATCH_SCORE = 80

function normalizeSkillName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9+#/\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findStudentBySkillName(
  studentByName: Map<string, { name: string; level: number; category: string | null }>,
  requiredName: string
) {
  const n = normalizeSkillName(requiredName)
  if (studentByName.has(n)) return studentByName.get(n)!
  for (const [key, val] of studentByName) {
    if (key === n || key.includes(n) || n.includes(key)) return val
  }
  return null
}

function studentSkillsNameMap(studentSkills: StudentSkillMap) {
  const byName = new Map<string, { name: string; level: number; category: string | null }>()
  for (const s of studentSkills.values()) {
    byName.set(normalizeSkillName(s.name), s)
  }
  return byName
}

function syntheticSkillId(name: string, index: number): number {
  return -(index + 1)
}

type StudentSkillMap = Map<number, { name: string; level: number; category: string | null }>

async function loadStudentSkills(
  supabase: SupabaseClient,
  profileId: number
): Promise<StudentSkillMap> {
  const { data, error } = await supabase
    .from('student_skills')
    .select('skill_id, proficiency_level, skills (name, category)')
    .eq('profile_id', profileId)
  throwIfError(error)
  const have = new Map<number, { name: string; level: number; category: string | null }>()
  for (const row of data ?? []) {
    const skill = row.skills as { name?: string; category?: string } | null
    have.set(row.skill_id as number, {
      name: skill?.name ?? String(row.skill_id),
      level: row.proficiency_level as number,
      category: skill?.category ?? null,
    })
  }
  return have
}

function buildMethodology(opts: {
  targetRole: string
  pathwayRole: { title: string; level: string | null; matchMethod: string } | null
  requiredLevel: number
  webSourced?: boolean
  extractionMethod?: string
  sources?: Array<{ title: string; url: string }>
}) {
  const web = opts.webSourced
  return {
    summary: web
      ? 'Compares your onboarding skills against industry requirements for this role, sourced from web research and structured by the Dira analysis agent.'
      : 'Compares your self-assessed onboarding skills against industry skills linked to a Dira pathway role that best matches your career interest.',
    dataSources: web
      ? [
          'student_skills: proficiency from onboarding (Beginner=1, Intermediate=3, Expert=5)',
          'Web search (Exa): job descriptions and competency lists for the target role',
          'Analysis agent (OpenRouter): extracts required skills and proficiency levels from snippets',
        ]
      : [
          'student_skills: proficiency from onboarding (Beginner=1, Intermediate=3, Expert=5)',
          'pathway_role_skills: skills expected for the matched industry role',
          'pathway_roles.level: maps to required proficiency per skill',
        ],
    metrics: [
      {
        name: 'Required proficiency',
        rule: 'ENTRY → Beginner (1), MID → Intermediate (3), SENIOR/SPECIALIST → Expert (5)',
        appliedLevel: opts.requiredLevel,
        appliedLabel: levelLabel(opts.requiredLevel),
      },
      {
        name: 'Status met',
        rule: 'You have the skill and your level is at or above required',
      },
      {
        name: 'Status upskill',
        rule: 'You have the skill but your level is below required',
      },
      {
        name: 'Status gap',
        rule: 'Industry skill not present in your profile',
      },
    ],
    roleMatch: opts.pathwayRole
      ? {
          interest: opts.targetRole,
          matchedRoleTitle: opts.pathwayRole.title,
          pathwayLevel: opts.pathwayRole.level,
          method: opts.pathwayRole.matchMethod,
        }
      : {
          interest: opts.targetRole,
          matchedRoleTitle: opts.targetRole,
          method: opts.extractionMethod ?? 'web_agent',
        },
    researchSources: opts.sources?.length ? opts.sources.slice(0, 6) : undefined,
    limitations: web
      ? [
          'Skill levels are self-reported during onboarding.',
          'Required skills are inferred from public web sources and may vary by employer.',
        ]
      : [
          'Skill levels are self-reported during onboarding.',
          'Industry skills come from the Dira pathway catalog when a close role match exists.',
        ],
  }
}

export async function buildSkillsAnalysisReport(
  supabase: SupabaseClient,
  profileId: number,
  targetRole: string
) {
  const studentSkills = await loadStudentSkills(supabase, profileId)
  const pathwayRole = await resolvePathwayRole(supabase, targetRole)

  const useCatalog =
    pathwayRole &&
    pathwayRole.matchScore >= CATALOG_MIN_MATCH_SCORE

  if (useCatalog && pathwayRole) {
    const catalogReport = await buildCatalogSkillsReport(
      supabase,
      profileId,
      targetRole,
      studentSkills,
      pathwayRole
    )
    if (catalogReport.report.skills.length > 0) {
      return catalogReport
    }
  }

  return buildWebSourcedSkillsReport(supabase, profileId, targetRole, studentSkills)
}

async function buildWebSourcedSkillsReport(
  supabase: SupabaseClient,
  profileId: number,
  targetRole: string,
  studentSkills: StudentSkillMap
) {
  const studentNames = [...studentSkills.values()].map((s) => s.name)
  const web = await fetchRequiredSkillsForRoleFromWeb(targetRole, studentNames)
  const byName = studentSkillsNameMap(studentSkills)

  const skills: SkillAnalysisRow[] = []
  let idx = 0
  for (const req of web.skills) {
    const current = findStudentBySkillName(byName, req.name)
    const requiredLevel = req.requiredLevel
    let status: SkillRowStatus = 'gap'
    let currentLevel: number | null = null
    if (current) {
      currentLevel = current.level
      status = current.level >= requiredLevel ? 'met' : 'upskill'
    }
    skills.push({
      skillId: syntheticSkillId(req.name, idx++),
      name: req.name,
      category: req.category,
      currentLevel,
      currentLevelLabel: currentLevel != null ? levelLabel(currentLevel) : MISSING_LEVEL_LABEL,
      requiredLevel,
      requiredLevelLabel: levelLabel(requiredLevel),
      status,
    })
  }

  const gaps = skills.filter((s) => s.status === 'gap').map((s) => s.name)
  const upskills = skills.filter((s) => s.status === 'upskill').map((s) => s.name)
  const strengths = skills.filter((s) => s.status === 'met').map((s) => s.name)

  const avgRequired =
    skills.length > 0
      ? Math.round(skills.reduce((a, s) => a + s.requiredLevel, 0) / skills.length)
      : 3
  const requiredLevel = avgRequired === 1 || avgRequired === 5 ? avgRequired : 3

  const curatedResources = await loadCuratedBySkillNames(supabase, [...gaps, ...upskills])

  const roleTitle = web.roleTitle
  const prioritisedPlan = buildPrioritisedPlanFromSkills(skills)

  const methodology = buildMethodology({
    targetRole,
    pathwayRole: null,
    requiredLevel,
    webSourced: true,
    extractionMethod: web.extractionMethod,
    sources: web.sources,
  })

  const report = {
    targetRole,
    pathwayRole: {
      roleId: null,
      title: roleTitle,
      level: web.seniority,
      matchScore: null,
      matchMethod: web.extractionMethod,
    },
    skillsSource: 'web_agent' as const,
    skills,
    gaps,
    upskills,
    strengths,
    curatedResources,
    prioritisedPlan,
    requiredLevel,
    requiredLevelLabel: 'Varies by skill',
    webSources: web.sources,
  }

  return { report, methodology }
}

async function loadCuratedBySkillNames(supabase: SupabaseClient, skillNames: string[]) {
  if (skillNames.length === 0) return []
  const { data: skillRows } = await supabase.from('skills').select('skill_id, name').limit(500)
  const ids: number[] = []
  for (const name of skillNames) {
    const n = normalizeSkillName(name)
    for (const row of skillRows ?? []) {
      const sn = normalizeSkillName(String(row.name))
      if (sn === n || sn.includes(n) || n.includes(sn)) {
        ids.push(row.skill_id as number)
        break
      }
    }
  }
  if (ids.length === 0) return []
  const { data: resources, error } = await supabase
    .from('learning_resources')
    .select('id, title, url, source, description, skill_id, skills (name)')
    .in('skill_id', ids)
  throwIfError(error)
  return (resources ?? []).map((r) => ({
    id: r.id as number,
    title: r.title as string,
    url: r.url as string,
    source: String(r.source),
    description: (r.description as string | null) ?? null,
    skillId: (r.skill_id as number | null) ?? null,
    skillName: (r.skills as { name?: string } | null)?.name ?? null,
  }))
}

async function buildCatalogSkillsReport(
  supabase: SupabaseClient,
  profileId: number,
  targetRole: string,
  studentSkills: StudentSkillMap,
  pathwayRole: NonNullable<Awaited<ReturnType<typeof resolvePathwayRole>>>
) {
  const requiredLevel = requiredLevelForRole(pathwayRole.level)

  const { data: roleSkillRows, error: rsError } = await supabase
    .from('pathway_role_skills')
    .select('skill_id, skills (name, category)')
    .eq('role_id', pathwayRole.role_id)
  throwIfError(rsError)

  const byName = studentSkillsNameMap(studentSkills)
  const skills: SkillAnalysisRow[] = []
  const gapSkillIds: number[] = []
  const upskillSkillIds: number[] = []

  for (const row of roleSkillRows ?? []) {
    const sk = row.skills as { name?: string; category?: string } | null
    const skillId = row.skill_id as number
    const name = sk?.name ?? String(skillId)
    const category = sk?.category ?? null
    const current =
      studentSkills.get(skillId) ?? findStudentBySkillName(byName, name)

    let status: SkillRowStatus = 'gap'
    let currentLevel: number | null = null
    if (current) {
      currentLevel = current.level
      status = current.level >= requiredLevel ? 'met' : 'upskill'
    }

    if (status === 'gap') gapSkillIds.push(skillId)
    if (status === 'upskill') upskillSkillIds.push(skillId)

    skills.push({
      skillId,
      name,
      category,
      currentLevel,
      currentLevelLabel: currentLevel != null ? levelLabel(currentLevel) : MISSING_LEVEL_LABEL,
      requiredLevel,
      requiredLevelLabel: levelLabel(requiredLevel),
      status,
    })
  }

  const gaps = skills.filter((s) => s.status === 'gap').map((s) => s.name)
  const upskills = skills.filter((s) => s.status === 'upskill').map((s) => s.name)
  const strengths = skills.filter((s) => s.status === 'met').map((s) => s.name)

  const needResourceIds = [...gapSkillIds, ...upskillSkillIds]
  let curatedResources: Array<{
    id: number
    title: string
    url: string
    source: string
    description: string | null
    skillId: number | null
    skillName: string | null
  }> = []

  if (needResourceIds.length > 0) {
    const { data: resources, error: lrError } = await supabase
      .from('learning_resources')
      .select('id, title, url, source, description, skill_id, skills (name)')
      .in('skill_id', needResourceIds)
    throwIfError(lrError)
    curatedResources = (resources ?? []).map((r) => ({
      id: r.id as number,
      title: r.title as string,
      url: r.url as string,
      source: String(r.source),
      description: (r.description as string | null) ?? null,
      skillId: (r.skill_id as number | null) ?? null,
      skillName: (r.skills as { name?: string } | null)?.name ?? null,
    }))
  }

  const prioritisedPlan = buildPrioritisedPlanFromSkills(skills)

  const methodology = buildMethodology({
    targetRole,
    pathwayRole: {
      title: pathwayRole.title,
      level: pathwayRole.level,
      matchMethod: pathwayRole.matchMethod,
    },
    requiredLevel,
  })

  const report = {
    targetRole,
    skillsSource: 'pathway_catalog' as const,
    pathwayRole: {
      roleId: pathwayRole.role_id,
      title: pathwayRole.title,
      level: pathwayRole.level,
      matchScore: pathwayRole.matchScore,
      matchMethod: pathwayRole.matchMethod,
    },
    skills,
    gaps,
    upskills,
    strengths,
    curatedResources,
    prioritisedPlan,
    requiredLevel,
    requiredLevelLabel: levelLabel(requiredLevel),
  }

  return { report, methodology }
}

export async function buildOpportunitySkillsReport(
  supabase: SupabaseClient,
  profileId: number,
  opportunityId: number
) {
  const studentSkills = await loadStudentSkills(supabase, profileId)
  const requiredLevel = 3

  const { data: oppSkills, error } = await supabase
    .from('opportunity_skills')
    .select('skill_id, skills (name, category)')
    .eq('opportunity_id', opportunityId)
  throwIfError(error)

  const skills: SkillAnalysisRow[] = []
  for (const row of oppSkills ?? []) {
    const sk = row.skills as { name?: string; category?: string } | null
    const skillId = row.skill_id as number
    const current = studentSkills.get(skillId)
    let status: SkillRowStatus = 'gap'
    let currentLevel: number | null = null
    if (current) {
      currentLevel = current.level
      status = current.level >= requiredLevel ? 'met' : 'upskill'
    }
    skills.push({
      skillId,
      name: sk?.name ?? String(skillId),
      category: sk?.category ?? null,
      currentLevel,
      currentLevelLabel: currentLevel != null ? levelLabel(currentLevel) : MISSING_LEVEL_LABEL,
      requiredLevel,
      requiredLevelLabel: levelLabel(requiredLevel),
      status,
    })
  }

  const gaps = skills.filter((s) => s.status === 'gap').map((s) => s.name)
  const upskills = skills.filter((s) => s.status === 'upskill').map((s) => s.name)
  const strengths = skills.filter((s) => s.status === 'met').map((s) => s.name)

  return {
    report: {
      targetRole: `Opportunity #${opportunityId}`,
      pathwayRole: null,
      skills,
      gaps,
      upskills,
      strengths,
      curatedResources: [],
      prioritisedPlan: buildPrioritisedPlanFromSkills(skills),
      requiredLevel,
      requiredLevelLabel: levelLabel(requiredLevel),
    },
    methodology: buildMethodology({
      targetRole: `Opportunity #${opportunityId}`,
      pathwayRole: null,
      requiredLevel,
    }),
  }
}
