export function isSupabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export function checkEnv() {
  if (!import.meta.env.DEV) return

  if (!isSupabaseConfigured()) {
    console.warn(
      '[Dira] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Auth will use local dev mode.'
    )
  }

  if (import.meta.env.VITE_USE_MOCK_AGENT === 'true') {
    console.warn('[Dira] VITE_USE_MOCK_AGENT=true — agent will use mocks instead of the Express API.')
  }
}
