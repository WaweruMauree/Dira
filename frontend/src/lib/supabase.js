import { createClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/env'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function createDiraClient(storageKey) {
  if (!isSupabaseConfigured()) return null
  return createClient(url, anonKey, {
    auth: { storageKey },
  })
}

/** Primary session for the student app (and legacy single-session admin login). */
export const supabase = createDiraClient('dira-auth-student')

/** Dev-only second session so admin can stay logged in in another tab. */
export const supabaseAdmin =
  import.meta.env.DEV && isSupabaseConfigured() ? createDiraClient('dira-auth-admin') : null
