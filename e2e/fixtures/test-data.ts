/** Thesis table T1–T10 identifiers */
export const TEST_IDS = {
  T1: { id: 'T1', requirement: 'FR1' },
  T2: { id: 'T2', requirement: 'FR2' },
  T3: { id: 'T3', requirement: 'FR3' },
  T4: { id: 'T4', requirement: 'FR4' },
  T5: { id: 'T5', requirement: 'FR5' },
  T6: { id: 'T6', requirement: 'FR6' },
  T7: { id: 'T7', requirement: 'FR7' },
  T8: { id: 'T8', requirement: 'FR8' },
  T9: { id: 'T9', requirement: 'FR9' },
  T10: { id: 'T10', requirement: 'NFR2' },
} as const

export const studentCredentials = {
  email: process.env.E2E_STUDENT_EMAIL?.trim() || 'test.student@gmail.com',
  password: process.env.E2E_STUDENT_PASSWORD?.trim() || 'password',
  fullName: process.env.E2E_STUDENT_NAME?.trim() || 'Test Student',
  phoneNational: process.env.E2E_STUDENT_PHONE?.trim() || '712345678',
}

export const adminCredentials = {
  email:
    process.env.E2E_ADMIN_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    '',
  password:
    process.env.E2E_ADMIN_PASSWORD?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    '',
}

export const onboardingProfile = {
  courseCatalogId: 'BBIT',
  yearOfStudy: 3,
  careerInterests: ['Data analysis', 'Software development', 'Data Analyst', 'Software developer'],
  technicalSkills: {
    SQL: 3,
  },
  softSkills: {
    Communication: 5,
  },
  careerReadiness: 'EXPLORING',
}

export const roles = {
  dataAnalyst: 'Data Analyst',
  softwareDeveloper: 'Software developer',
}

export const T8_SEED_TITLES = {
  approve: `E2E Pending Approve ${Date.now()}`,
  reject: `E2E Pending Reject ${Date.now()}`,
}