import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/env'
import { clearLegacyDevSession } from '@/lib/storage'
import { diraApi } from '@/lib/api/dira'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [onboarded, setOnboarded] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async (accessToken) => {
    if (!accessToken) {
      setProfile(null)
      setOnboarded(false)
      return false
    }
    try {
      const { data } = await diraApi.me(accessToken)
      setProfile(data)
      const done = Boolean(data.onboarded)
      setOnboarded(done)
      return done
    } catch {
      setProfile(null)
      setOnboarded(false)
      return false
    }
  }, [])

  useEffect(() => {
    clearLegacyDevSession()

    if (!isSupabaseConfigured()) {
      setSession(null)
      setUser(null)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      await loadMe(s?.access_token)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      loadMe(s?.access_token)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [loadMe])

  const signUp = async ({ email, password, fullName }) => {
    if (!isSupabaseConfigured()) {
      const devUser = { id: 'dev-user', email, user_metadata: { full_name: fullName } }
      setSession({ user: devUser })
      setUser(devUser)
      return { user: devUser, error: null }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'STUDENT' } },
    })
    return { user: data.user, session: data.session, error }
  }

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured()) {
      const devUser = { id: 'dev-user', email, user_metadata: { full_name: email.split('@')[0] } }
      setSession({ user: devUser })
      setUser(devUser)
      return { user: devUser, error: null }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    let isOnboarded = false
    if (!error && data.session) {
      isOnboarded = await loadMe(data.session.access_token)
    }
    return { user: data.user, session: data.session, error, onboarded: isOnboarded }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      setSession(null)
      setUser(null)
      setProfile(null)
      setOnboarded(false)
      return
    }
    await supabase.auth.signOut()
    setProfile(null)
    setOnboarded(false)
  }

  const getAccessToken = useCallback(async () => {
    if (!isSupabaseConfigured()) return null
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }, [])

  const refreshMe = useCallback(async () => {
    const token = await getAccessToken()
    await loadMe(token)
  }, [getAccessToken, loadMe])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        onboarded,
        loading,
        signUp,
        signIn,
        signOut,
        getAccessToken,
        refreshMe,
        isConfigured: isSupabaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getPostAuthPath(onboarded) {
  return onboarded ? '/home' : '/onboarding'
}
