import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export type ProfileRow = {
  id: string
  phone_number: string | null
  username: string | null
  full_name: string | null
  admission_number: string | null
  role: 'STUDENT' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED'
  created_at: string
  updated_at: string
}

declare global {
  namespace Express {
    interface Request {
      accessToken: string
      authUser: User
      profile: ProfileRow
      supabase: SupabaseClient
    }
  }
}

export {}
