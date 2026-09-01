import { User } from 'lucide-react'
import { diraApi } from '@/lib/api/dira'
import type { ClientToolDefinition } from '@/lib/api/types'

export const profileLookupTool = {
  name: 'profileLookup',
  label: 'Profile Lookup',
  icon: User,
  runningLabel: 'Loading profile...',
  completeLabel: 'Profile loaded',
}

export const profileLookupDefinition: ClientToolDefinition = {
  name: 'profileLookup',
  description: 'Load the current student profile, skills, and career interests.',
  parameters: { type: 'object', properties: {} },
}

export async function executeProfileLookup(_input: Record<string, unknown>, token: string | null) {
  if (!token) throw new Error('Not signed in')
  const { data } = await diraApi.me(token)
  return {
    course: data.student?.course,
    year: data.studentProfile?.year_of_study,
    readiness: data.studentProfile?.career_readiness,
    onboarded: data.onboarded,
    skills: data.skills,
    interests: data.interests,
    fullName: data.profile.full_name,
  }
}
