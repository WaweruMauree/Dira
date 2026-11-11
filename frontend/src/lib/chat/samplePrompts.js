/** Fixed starter prompts on Home (not tied to profile interests). */
export const STATIC_SAMPLE_PROMPTS = [
  {
    id: 'cv-fintech',
    label: 'Help me write a CV for FinTech',
    message: 'Help me write a CV for FinTech.',
  },
  {
    id: 'resources-fintech',
    label: 'Resources to learn about FinTech',
    message: 'What resources can I use to learn more about FinTech?',
  },
  {
    id: 'internship-prep',
    label: 'How should I prepare for internship applications?',
    message: 'How should I prepare for internship applications in my field?',
  },
]

export function getStaticSamplePrompts() {
  return STATIC_SAMPLE_PROMPTS
}

/**
 * @param {string | null | undefined} fullName
 */
export function firstNameFromProfile(fullName) {
  const raw = (fullName ?? '').trim()
  if (!raw) return 'there'
  return raw.split(/\s+/)[0] || 'there'
}
