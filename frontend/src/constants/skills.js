export const SOFT_SKILLS = [
  'Communication',
  'Teamwork',
  'Leadership',
  'Problem Solving',
  'Time Management',
  'Critical Thinking',
  'Adaptability',
  'Presentation Skills',
]

/** Fallback when course is unset or "Other" */
export const GENERIC_TECHNICAL_SKILLS = [
  'Python',
  'JavaScript',
  'SQL',
  'Excel',
  'Data Analysis',
  'Statistics',
  'Research',
  'Microsoft Word',
]

export const GENERIC_SOFT_SKILLS = SOFT_SKILLS

export const CAREER_INTERESTS = [
  'Data Science',
  'Software Engineering',
  'Product Management',
  'Finance',
  'Legal Tech',
  'Consulting',
  'Entrepreneurship',
  'Research',
  'Marketing',
  'Cybersecurity',
]

export const COURSES = [
  'BBIT',
  'BSc Computer Science',
  'BSc Applied Statistics',
  'BBA',
  'LLB',
  'BSc Hospitality Management',
  'BSc International Business',
  'Other',
]

export const YEARS_OF_STUDY = [1, 2, 3, 4, 5]

/**
 * Course-tailored skill profiles for onboarding step 2.
 * Technical + soft skills reflect what each programme typically assesses.
 */
export const COURSE_SKILL_PROFILES = {
  BBIT: {
    label: 'Business & IT',
    technical: [
      'Python',
      'JavaScript',
      'SQL',
      'Java',
      'React',
      'Excel',
      'Data Analysis',
      'Cloud Computing',
      'API Development',
    ],
    soft: [
      'Problem Solving',
      'Communication',
      'Teamwork',
      'Critical Thinking',
      'Time Management',
      'Adaptability',
    ],
  },
  'BSc Computer Science': {
    label: 'Computer Science',
    technical: [
      'Python',
      'JavaScript',
      'Java',
      'C++',
      'SQL',
      'React',
      'Algorithms',
      'Machine Learning',
      'Cloud Computing',
      'Git & Version Control',
    ],
    soft: [
      'Problem Solving',
      'Critical Thinking',
      'Teamwork',
      'Communication',
      'Adaptability',
      'Attention to Detail',
    ],
  },
  'BSc Applied Statistics': {
    label: 'Applied Statistics',
    technical: [
      'Statistics',
      'Python',
      'R',
      'SQL',
      'Excel',
      'Data Analysis',
      'Machine Learning',
      'SPSS',
      'Data Visualization',
    ],
    soft: [
      'Critical Thinking',
      'Problem Solving',
      'Communication',
      'Presentation Skills',
      'Attention to Detail',
      'Research',
    ],
  },
  BBA: {
    label: 'Business Administration',
    technical: [
      'Excel',
      'Financial Modeling',
      'PowerPoint',
      'SQL',
      'Data Analysis',
      'Accounting Software',
      'Market Research',
      'CRM Tools',
    ],
    soft: [
      'Communication',
      'Leadership',
      'Presentation Skills',
      'Teamwork',
      'Negotiation',
      'Time Management',
    ],
  },
  LLB: {
    label: 'Law',
    technical: [
      'Legal Research',
      'Microsoft Word',
      'Document Drafting',
      'Excel',
      'Case Briefing',
      'Legal Writing',
      'Westlaw / Legal Databases',
      'Contract Review',
    ],
    soft: [
      'Critical Thinking',
      'Communication',
      'Argumentation',
      'Attention to Detail',
      'Ethical Judgment',
      'Research',
      'Client Relations',
    ],
  },
  'BSc Hospitality Management': {
    label: 'Hospitality Management',
    technical: [
      'Excel',
      'POS Systems',
      'Revenue Management',
      'Event Planning Software',
      'Microsoft Word',
      'Budgeting',
      'Customer Relationship Tools',
      'Inventory Management',
    ],
    soft: [
      'Customer Service',
      'Communication',
      'Teamwork',
      'Leadership',
      'Problem Solving',
      'Adaptability',
      'Time Management',
    ],
  },
  'BSc International Business': {
    label: 'International Business',
    technical: [
      'Excel',
      'SQL',
      'Market Research',
      'PowerPoint',
      'CRM Tools',
      'Financial Analysis',
      'Trade & Compliance Tools',
      'Data Analysis',
    ],
    soft: [
      'Communication',
      'Cross-cultural Awareness',
      'Negotiation',
      'Presentation Skills',
      'Teamwork',
      'Adaptability',
      'Leadership',
    ],
  },
  Other: {
    label: 'General',
    technical: GENERIC_TECHNICAL_SKILLS,
    soft: GENERIC_SOFT_SKILLS,
  },
}

export function getCourseSkillProfile(course) {
  if (!course) {
    return {
      label: 'Select a course',
      technical: GENERIC_TECHNICAL_SKILLS,
      soft: GENERIC_SOFT_SKILLS,
    }
  }
  return COURSE_SKILL_PROFILES[course] ?? COURSE_SKILL_PROFILES.Other
}

export function getTechnicalSkillsForCourse(course) {
  return getCourseSkillProfile(course).technical
}

export function getSoftSkillsForCourse(course) {
  return getCourseSkillProfile(course).soft
}

/** Keep only skills that belong to the current course profile */
export function filterSkillsForCourse(skillMap, allowedSkills) {
  if (!skillMap || !allowedSkills) return {}
  const allowed = new Set(allowedSkills)
  return Object.fromEntries(
    Object.entries(skillMap).filter(([skill]) => allowed.has(skill))
  )
}

/** @deprecated use getTechnicalSkillsForCourse */
export const TECHNICAL_SKILLS = GENERIC_TECHNICAL_SKILLS
