/**
 * @param {Record<string, unknown>} resume
 */
export function resumeToMarkdown(resume) {
  if (!resume || typeof resume !== 'object') return ''
  const basics = resume.basics ?? {}
  const lines = []
  if (basics.name) lines.push(`# ${basics.name}`)
  if (basics.label) lines.push(`**${basics.label}**`)
  if (basics.summary) {
    lines.push('')
    lines.push(basics.summary)
  }
  const education = resume.education
  if (Array.isArray(education) && education.length) {
    lines.push('', '## Education')
    for (const ed of education) {
      lines.push(`- ${ed.institution ?? ''}: ${ed.area ?? ''} (${ed.studyType ?? ''})`.trim())
    }
  }
  const skills = resume.skills
  if (Array.isArray(skills) && skills.length) {
    lines.push('', '## Skills')
    lines.push(skills.map((s) => s.name).filter(Boolean).join(', '))
  }
  const interests = resume.interests
  if (Array.isArray(interests) && interests.length) {
    lines.push('', '## Interests')
    lines.push(interests.map((i) => i.name).filter(Boolean).join(', '))
  }
  return lines.join('\n').trim()
}
