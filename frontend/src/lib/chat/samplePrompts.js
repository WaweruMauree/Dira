/**
 * @param {string[]} interests
 * @returns {string}
 */
export function pickRandomInterest(interests) {
  const list = (interests ?? []).filter(Boolean)
  if (list.length === 0) return null
  return list[Math.floor(Math.random() * list.length)]
}

/**
 * @param {string[]} interests
 */
export function buildSamplePrompts(interests) {
  const role = pickRandomInterest(interests) ?? 'my target role'
  return [
    {
      id: 'cv',
      label: `Help me write a CV for ${role}`,
      message: `Help me write a CV for ${role}.`,
    },
    {
      id: 'resources',
      label: `Resources to learn about ${role}`,
      message: `What resources can I use to learn more about ${role}?`,
    },
  ]
}

/**
 * @param {string | null | undefined} fullName
 */
export function firstNameFromProfile(fullName) {
  const raw = (fullName ?? '').trim()
  if (!raw) return 'there'
  return raw.split(/\s+/)[0] || 'there'
}
