import type { WebSourcedRoleSkill } from '../services/roleSkillsFromAgent.js'

const INTEREST_SKILLS: Record<string, WebSourcedRoleSkill[]> = {
  entrepreneurship: [
    { name: 'Business Planning', category: 'TECH', requiredLevel: 3 },
    { name: 'Market Research', category: 'TECH', requiredLevel: 3 },
    { name: 'Financial Literacy', category: 'TECH', requiredLevel: 3 },
    { name: 'Sales & Pitching', category: 'SOFT', requiredLevel: 3 },
    { name: 'Networking', category: 'SOFT', requiredLevel: 3 },
    { name: 'Risk Management', category: 'TECH', requiredLevel: 1 },
    { name: 'Digital Marketing', category: 'TECH', requiredLevel: 3 },
    { name: 'Leadership', category: 'SOFT', requiredLevel: 3 },
    { name: 'Negotiation', category: 'SOFT', requiredLevel: 3 },
    { name: 'Customer Discovery', category: 'TECH', requiredLevel: 3 },
  ],
  fintech: [
    { name: 'Financial Modeling', category: 'TECH', requiredLevel: 3 },
    { name: 'Excel / Spreadsheets', category: 'TECH', requiredLevel: 3 },
    { name: 'SQL', category: 'TECH', requiredLevel: 3 },
    { name: 'Python', category: 'TECH', requiredLevel: 3 },
    { name: 'Regulatory Awareness', category: 'TECH', requiredLevel: 1 },
    { name: 'Data Analysis', category: 'TECH', requiredLevel: 3 },
    { name: 'Communication', category: 'SOFT', requiredLevel: 3 },
    { name: 'Problem Solving', category: 'SOFT', requiredLevel: 3 },
  ],
  consulting: [
    { name: 'Structured Problem Solving', category: 'TECH', requiredLevel: 3 },
    { name: 'Data Analysis', category: 'TECH', requiredLevel: 3 },
    { name: 'Presentation Skills', category: 'SOFT', requiredLevel: 3 },
    { name: 'Stakeholder Communication', category: 'SOFT', requiredLevel: 3 },
    { name: 'Research', category: 'TECH', requiredLevel: 3 },
    { name: 'Excel', category: 'TECH', requiredLevel: 3 },
    { name: 'Business Acumen', category: 'SOFT', requiredLevel: 3 },
  ],
}

function normalizeInterestKey(targetRole: string): string {
  return targetRole.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function fallbackRoleSkills(targetRole: string): {
  roleTitle: string
  skills: WebSourcedRoleSkill[]
  extractionMethod: string
} | null {
  const key = normalizeInterestKey(targetRole)
  for (const [interest, skills] of Object.entries(INTEREST_SKILLS)) {
    if (key === interest || key.includes(interest) || interest.includes(key)) {
      return {
        roleTitle: targetRole.trim(),
        skills,
        extractionMethod: 'static_interest_benchmark',
      }
    }
  }
  const generic: WebSourcedRoleSkill[] = [
    { name: 'Communication', category: 'SOFT', requiredLevel: 3 },
    { name: 'Problem Solving', category: 'SOFT', requiredLevel: 3 },
    { name: 'Teamwork', category: 'SOFT', requiredLevel: 3 },
    { name: 'Research', category: 'TECH', requiredLevel: 3 },
    { name: 'Time Management', category: 'SOFT', requiredLevel: 3 },
    { name: 'Adaptability', category: 'SOFT', requiredLevel: 3 },
    { name: 'Critical Thinking', category: 'SOFT', requiredLevel: 3 },
    { name: 'Domain Fundamentals', category: 'TECH', requiredLevel: 3 },
  ]
  return {
    roleTitle: targetRole.trim(),
    skills: generic,
    extractionMethod: 'static_generic_benchmark',
  }
}
