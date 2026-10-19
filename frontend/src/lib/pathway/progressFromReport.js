/**
 * When stored roadmap has fewer steps than gap/upskill skills in the analysis report,
 * compute display progress from the report skill list + step statuses by skillName.
 */
export function developmentSkillNamesFromReport(report) {
  if (!report) return []
  const fromSkills = (report.skills ?? [])
    .filter((s) => s.status === 'gap' || s.status === 'upskill')
    .map((s) => s.name)
  if (fromSkills.length) return fromSkills
  const seen = new Set()
  const out = []
  for (const name of [...(report.gaps ?? []), ...(report.upskills ?? [])]) {
    const key = String(name).trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(String(name).trim())
  }
  return out
}

export function resolvePathwayProgress(roadmap, gapReport) {
  const summary = roadmap?.progressSummary
  const steps = roadmap?.steps ?? []
  const devSkills = developmentSkillNamesFromReport(gapReport)

  if (!devSkills.length || steps.length >= devSkills.length) {
    return summary ?? { completedSteps: 0, totalSteps: steps.length, percent: 0 }
  }

  const statusBySkill = new Map(steps.map((s) => [s.skillName.toLowerCase(), s.status]))
  let completedSteps = 0
  for (const name of devSkills) {
    if (statusBySkill.get(name.toLowerCase()) === 'complete') completedSteps += 1
  }
  const totalSteps = devSkills.length
  const percent = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0
  return { completedSteps, totalSteps, percent }
}
