export type UserJobInput = {
  externalId: string
  source: string
  title: string
  organisation?: string | null
  description?: string | null
  location?: string | null
  url?: string | null
  employmentType?: string | null
  experienceLevel?: number | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  salaryPeriod?: string | null
  salaryText?: string | null
  publishedAt?: string | null
  tags?: string[]
  raw?: Record<string, unknown>
  saved?: boolean
}

export type StudentRecommendContext = {
  userId: string
  course: string | null
  yearOfStudy: number | null
  interests: string[]
  skillNames: string[]
  technicalSkillNames: string[]
}
