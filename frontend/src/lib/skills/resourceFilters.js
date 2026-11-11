function norm(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
}

export function resourcesForSkill(curated, skillName) {
  if (!skillName || !curated?.length) return []
  const needle = norm(skillName)
  return curated.filter((r) => norm(r.skillName) === needle)
}

export function agentGroupForSkill(groups, skillName) {
  if (!skillName || !groups?.length) return null
  const needle = norm(skillName)
  return groups.find((g) => norm(g.skill) === needle) ?? null
}

export function agentGroupsForSkill(groups, skillName) {
  const g = agentGroupForSkill(groups, skillName)
  return g ? [g] : []
}

export function minItemsHint(count, min = 2) {
  if (count >= min) return null
  if (count === 0) return null
  return `Only ${count} catalog ${count === 1 ? 'item' : 'items'} for this skill in the Dira catalog right now.`
}
