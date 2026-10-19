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

export const OTHER_COURSE_ID = 'OTHER'

/** Stable catalog ids; label is shown in UI and stored in DB for known programmes */
export const COURSE_OPTIONS = [
  { id: 'BBIT', label: 'Bachelor of Business Information Technology (BBIT)' },
  { id: 'BSC_CS', label: 'BSc Computer Science' },
  { id: 'BSC_STATS', label: 'BSc Applied Statistics' },
  { id: 'BBA', label: 'Bachelor of Business Administration (BBA)' },
  { id: 'LLB', label: 'Bachelor of Laws (LLB)' },
  { id: 'BSC_CNS', label: 'BSc Computer Networks and Security (CNS)' },
  { id: 'BSC_ACTUARIAL', label: 'BSc Actuarial Science' },
  { id: 'BSC_FIN_ECON', label: 'BSc Financial Economics' },
  { id: 'BSC_FIN_ENG', label: 'BSc Financial Engineering' },
  { id: 'BCOM', label: 'BSc Business Commerce (BCOM)' },
  { id: 'BSC_TOURISM', label: 'BSc Tourism and Hospitality Management' },
  { id: 'BSC_INTL_STUDIES', label: 'BSc International Studies' },
  { id: OTHER_COURSE_ID, label: 'Other' },
]

export const YEARS_OF_STUDY = [1, 2, 3, 4, 5]

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
    soft: ['Problem Solving', 'Communication', 'Teamwork', 'Critical Thinking', 'Time Management', 'Adaptability'],
  },
  BSC_CS: {
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
    soft: ['Problem Solving', 'Critical Thinking', 'Teamwork', 'Communication', 'Adaptability', 'Attention to Detail'],
  },
  BSC_STATS: {
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
    soft: ['Critical Thinking', 'Problem Solving', 'Communication', 'Presentation Skills', 'Attention to Detail', 'Research'],
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
    soft: ['Communication', 'Leadership', 'Presentation Skills', 'Teamwork', 'Negotiation', 'Time Management'],
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
    soft: ['Critical Thinking', 'Communication', 'Argumentation', 'Attention to Detail', 'Ethical Judgment', 'Research', 'Client Relations'],
  },
  BSC_CNS: {
    label: 'Computer Networks & Security',
    technical: [
      'Network Administration',
      'Cybersecurity',
      'Linux',
      'Python',
      'Firewall Configuration',
      'Cloud Security',
      'Penetration Testing Basics',
      'SQL',
    ],
    soft: ['Problem Solving', 'Attention to Detail', 'Communication', 'Teamwork', 'Critical Thinking', 'Adaptability'],
  },
  BSC_ACTUARIAL: {
    label: 'Actuarial Science',
    technical: [
      'Statistics',
      'Probability',
      'Excel',
      'R',
      'Python',
      'Financial Modeling',
      'SQL',
      'Risk Analysis',
    ],
    soft: ['Critical Thinking', 'Attention to Detail', 'Problem Solving', 'Communication', 'Presentation Skills', 'Research'],
  },
  BSC_FIN_ECON: {
    label: 'Financial Economics',
    technical: [
      'Econometrics',
      'Excel',
      'Financial Modeling',
      'Statistics',
      'Python',
      'SQL',
      'Market Analysis',
      'Stata',
    ],
    soft: ['Critical Thinking', 'Communication', 'Problem Solving', 'Presentation Skills', 'Research', 'Attention to Detail'],
  },
  BSC_FIN_ENG: {
    label: 'Financial Engineering',
    technical: [
      'Python',
      'Quantitative Finance',
      'Excel',
      'SQL',
      'Financial Modeling',
      'Statistics',
      'MATLAB',
      'Risk Management',
    ],
    soft: ['Problem Solving', 'Critical Thinking', 'Attention to Detail', 'Communication', 'Teamwork', 'Adaptability'],
  },
  BCOM: {
    label: 'Business Commerce',
    technical: [
      'Excel',
      'Accounting Software',
      'PowerPoint',
      'Market Research',
      'CRM Tools',
      'Data Analysis',
      'E-commerce Platforms',
      'SQL',
    ],
    soft: ['Communication', 'Negotiation', 'Teamwork', 'Leadership', 'Presentation Skills', 'Customer Service'],
  },
  BSC_TOURISM: {
    label: 'Tourism & Hospitality',
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
    soft: ['Customer Service', 'Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Adaptability', 'Time Management'],
  },
  BSC_INTL_STUDIES: {
    label: 'International Studies',
    technical: [
      'Excel',
      'Research Methods',
      'PowerPoint',
      'Policy Analysis',
      'Data Analysis',
      'Microsoft Word',
      'Foreign Language Tools',
      'CRM Tools',
    ],
    soft: ['Cross-cultural Awareness', 'Communication', 'Critical Thinking', 'Negotiation', 'Presentation Skills', 'Adaptability', 'Research'],
  },
  OTHER: {
    label: 'General',
    technical: GENERIC_TECHNICAL_SKILLS,
    soft: GENERIC_SOFT_SKILLS,
  },
}

export const COURSE_CAREER_INTERESTS = {
  BBIT: ['Software Engineering', 'Product Management', 'Data Science', 'FinTech', 'Consulting', 'Entrepreneurship', 'Cybersecurity'],
  BSC_CS: ['Software Engineering', 'Cybersecurity', 'Data Science', 'Machine Learning', 'Cloud Engineering', 'Game Development', 'Research'],
  BSC_STATS: ['Data Science', 'Actuarial Science', 'Research', 'Consulting', 'Public Policy', 'Finance', 'Healthcare Analytics'],
  BBA: ['Finance', 'Consulting', 'Marketing', 'Entrepreneurship', 'Product Management', 'Human Resources', 'Operations'],
  LLB: ['Legal Tech', 'Corporate Law', 'Litigation', 'Public Policy', 'Compliance', 'Human Rights', 'Consulting'],
  BSC_CNS: ['Cybersecurity', 'Network Engineering', 'Cloud Security', 'IT Support', 'Penetration Testing', 'DevOps', 'Consulting'],
  BSC_ACTUARIAL: ['Actuarial Science', 'Risk Management', 'Insurance', 'Finance', 'Data Science', 'Consulting', 'Banking'],
  BSC_FIN_ECON: ['Finance', 'Economic Research', 'Banking', 'Public Policy', 'Consulting', 'Investment Analysis', 'Development Finance'],
  BSC_FIN_ENG: ['Quantitative Finance', 'Risk Management', 'Investment Banking', 'FinTech', 'Data Science', 'Trading', 'Consulting'],
  BCOM: ['Sales', 'Marketing', 'Entrepreneurship', 'E-commerce', 'Supply Chain', 'Finance', 'Consulting'],
  BSC_TOURISM: ['Hotel Management', 'Event Planning', 'Travel & Tourism', 'Customer Experience', 'Marketing', 'Entrepreneurship', 'Operations'],
  BSC_INTL_STUDIES: ['Diplomacy', 'International Development', 'NGO Work', 'Public Policy', 'Consulting', 'Research', 'Cross-border Business'],
  OTHER: ['Data Science', 'Software Engineering', 'Finance', 'Consulting', 'Entrepreneurship', 'Research', 'Marketing', 'Public Service'],
}

export function getCourseOption(catalogId) {
  return COURSE_OPTIONS.find((c) => c.id === catalogId) ?? null
}

export function getCourseLabel(catalogId) {
  return getCourseOption(catalogId)?.label ?? catalogId ?? ''
}

export function getProfileKey(form) {
  const id = form?.courseCatalogId || form?.course
  if (!id) return OTHER_COURSE_ID
  return COURSE_SKILL_PROFILES[id] ? id : OTHER_COURSE_ID
}

export function getCourseDisplayLabel(form) {
  const key = getProfileKey(form)
  if (key === OTHER_COURSE_ID && form?.otherProgramme?.trim()) {
    return form.otherProgramme.trim()
  }
  return getCourseLabel(key)
}

export function resolveCourseForDatabase(form) {
  const key = getProfileKey(form)
  if (key === OTHER_COURSE_ID) {
    return (form.otherProgramme || '').trim().slice(0, 150)
  }
  return getCourseLabel(key).slice(0, 150)
}

export function getCourseSkillProfile(profileKey) {
  if (!profileKey) {
    return {
      label: 'Select a course',
      technical: GENERIC_TECHNICAL_SKILLS,
      soft: GENERIC_SOFT_SKILLS,
    }
  }
  return COURSE_SKILL_PROFILES[profileKey] ?? COURSE_SKILL_PROFILES.OTHER
}

export function getTechnicalSkillsForCourse(profileKey) {
  return getCourseSkillProfile(profileKey).technical
}

export function getSoftSkillsForCourse(profileKey) {
  return getCourseSkillProfile(profileKey).soft
}

export function getCareerInterestsForCourse(profileKey) {
  return COURSE_CAREER_INTERESTS[profileKey] ?? COURSE_CAREER_INTERESTS.OTHER
}

export function filterSkillsForCourse(skillMap, allowedSkills, extraAllowed = []) {
  if (!skillMap) return {}
  const allowed = new Set([...(allowedSkills || []), ...extraAllowed])
  return Object.fromEntries(Object.entries(skillMap).filter(([skill]) => allowed.has(skill)))
}

/** Preset list only — custom skills stay in map even if not in preset */
export function filterPresetSkillsOnly(skillMap, presetList) {
  if (!skillMap || !presetList) return {}
  const preset = new Set(presetList)
  return Object.fromEntries(Object.entries(skillMap).filter(([skill]) => !preset.has(skill)))
}

export const COURSES = COURSE_OPTIONS.map((c) => c.id)

export const CAREER_INTERESTS = COURSE_CAREER_INTERESTS.OTHER

export const TECHNICAL_SKILLS = GENERIC_TECHNICAL_SKILLS
