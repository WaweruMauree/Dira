/** Static onboarding presets — mirrors frontend/src/constants/skills.js for API fallback. */

const GENERIC_TECHNICAL = [
  'Python',
  'JavaScript',
  'SQL',
  'Excel',
  'Data Analysis',
  'Statistics',
  'Research',
  'Microsoft Word',
]

const GENERIC_SOFT = [
  'Communication',
  'Teamwork',
  'Leadership',
  'Problem Solving',
  'Time Management',
  'Critical Thinking',
  'Adaptability',
  'Presentation Skills',
]

export type CourseSkillProfile = {
  label: string
  technical: string[]
  soft: string[]
  careerInterests: string[]
}

const PROFILES: Record<string, CourseSkillProfile> = {
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
    careerInterests: [
      'Software Engineering',
      'Product Management',
      'Data Science',
      'FinTech',
      'Consulting',
      'Entrepreneurship',
      'Cybersecurity',
    ],
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
    careerInterests: [
      'Software Engineering',
      'Cybersecurity',
      'Data Science',
      'Machine Learning',
      'Cloud Engineering',
      'Game Development',
      'Research',
    ],
  },
  BSC_STATS: {
    label: 'Applied Statistics',
    technical: ['Statistics', 'Python', 'R', 'SQL', 'Excel', 'Data Analysis', 'Machine Learning', 'SPSS', 'Data Visualization'],
    soft: ['Critical Thinking', 'Problem Solving', 'Communication', 'Presentation Skills', 'Attention to Detail', 'Research'],
    careerInterests: [
      'Data Science',
      'Actuarial Science',
      'Research',
      'Consulting',
      'Public Policy',
      'Finance',
      'Healthcare Analytics',
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
    soft: ['Communication', 'Leadership', 'Presentation Skills', 'Teamwork', 'Negotiation', 'Time Management'],
    careerInterests: ['Finance', 'Consulting', 'Marketing', 'Entrepreneurship', 'Product Management', 'Human Resources', 'Operations'],
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
    careerInterests: ['Legal Tech', 'Corporate Law', 'Litigation', 'Public Policy', 'Compliance', 'Human Rights', 'Consulting'],
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
    careerInterests: [
      'Cybersecurity',
      'Network Engineering',
      'Cloud Security',
      'IT Support',
      'Penetration Testing',
      'DevOps',
      'Consulting',
    ],
  },
  BSC_ACTUARIAL: {
    label: 'Actuarial Science',
    technical: ['Statistics', 'Probability', 'Excel', 'R', 'Python', 'Financial Modeling', 'SQL', 'Risk Analysis'],
    soft: ['Critical Thinking', 'Attention to Detail', 'Problem Solving', 'Communication', 'Presentation Skills', 'Research'],
    careerInterests: [
      'Actuarial Science',
      'Risk Management',
      'Insurance',
      'Finance',
      'Data Science',
      'Consulting',
      'Banking',
    ],
  },
  BSC_FIN_ECON: {
    label: 'Financial Economics',
    technical: ['Econometrics', 'Excel', 'Financial Modeling', 'Statistics', 'Python', 'SQL', 'Market Analysis', 'Stata'],
    soft: ['Critical Thinking', 'Communication', 'Problem Solving', 'Presentation Skills', 'Research', 'Attention to Detail'],
    careerInterests: [
      'Finance',
      'Economic Research',
      'Banking',
      'Public Policy',
      'Consulting',
      'Investment Analysis',
      'Development Finance',
    ],
  },
  BSC_FIN_ENG: {
    label: 'Financial Engineering',
    technical: ['Python', 'Quantitative Finance', 'Excel', 'SQL', 'Financial Modeling', 'Statistics', 'MATLAB', 'Risk Management'],
    soft: ['Problem Solving', 'Critical Thinking', 'Attention to Detail', 'Communication', 'Teamwork', 'Adaptability'],
    careerInterests: [
      'Quantitative Finance',
      'Risk Management',
      'Investment Banking',
      'FinTech',
      'Data Science',
      'Trading',
      'Consulting',
    ],
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
    careerInterests: ['Sales', 'Marketing', 'Entrepreneurship', 'E-commerce', 'Supply Chain', 'Finance', 'Consulting'],
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
    careerInterests: [
      'Hotel Management',
      'Event Planning',
      'Travel & Tourism',
      'Customer Experience',
      'Marketing',
      'Entrepreneurship',
      'Operations',
    ],
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
    careerInterests: [
      'Diplomacy',
      'International Development',
      'NGO Work',
      'Public Policy',
      'Consulting',
      'Research',
      'Cross-border Business',
    ],
  },
  OTHER: {
    label: 'General',
    technical: GENERIC_TECHNICAL,
    soft: GENERIC_SOFT,
    careerInterests: [
      'Data Science',
      'Software Engineering',
      'Finance',
      'Consulting',
      'Entrepreneurship',
      'Research',
      'Marketing',
      'Public Service',
    ],
  },
}

export function resolveCatalogProfileKey(courseCatalogId: string): string {
  const id = courseCatalogId?.trim() || 'OTHER'
  return PROFILES[id] ? id : 'OTHER'
}

export function staticProgrammeFallback(courseCatalogId: string): {
  technicalSkills: string[]
  softSkills: string[]
  careerInterests: string[]
  programmeSector: string | null
} {
  const key = resolveCatalogProfileKey(courseCatalogId)
  const p = PROFILES[key] ?? PROFILES.OTHER!
  return {
    technicalSkills: [...p.technical],
    softSkills: [...p.soft],
    careerInterests: [...p.careerInterests],
    programmeSector: null,
  }
}
