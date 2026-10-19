import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/env'
import { clearLegacyDevSession } from '@/lib/storage'
import { diraApi } from '@/lib/api/dira'
import { AgentApiError } from '@/lib/api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [meSnapshot, setMeSnapshot] = useState(null)
  const [onboarded, setOnboarded] = useState(false)
  const [loading, setLoading] = useState(true)

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setSession(null)
      setUser(null)
      setProfile(null)
      setMeSnapshot(null)
      setOnboarded(false)
      return
    }
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
    setMeSnapshot(null)
    setOnboarded(false)
  }, [])

  const loadMe = useCallback(
    async (accessToken, { preserveOnError = false } = {}) => {
      if (!accessToken) {
        setProfile(null)
        setMeSnapshot(null)
        setOnboarded(false)
        return { done: false, profile: null }
      }
      try {
        const { data } = await diraApi.me(accessToken)
        setProfile(data.profile)
        setMeSnapshot(data)
        const done = Boolean(data.onboarded)
        setOnboarded(done)
        return { done, profile: data.profile }
      } catch (err) {
        const isMissingProfile =
          err instanceof AgentApiError &&
          err.status === 403 &&
          /profile not found/i.test(err.message)

        if (isMissingProfile && isSupabaseConfigured()) {
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          setProfile(null)
          setMeSnapshot(null)
          setOnboarded(false)
          return { done: false, profile: null }
        }

        if (preserveOnError) {
          return { done: false, profile: null }
        }
        setProfile(null)
        setMeSnapshot(null)
        setOnboarded(false)
        return { done: false, profile: null }
      }
    },
    []
  )

  const hydrateSession = useCallback(
    async (s) => {
      setSession(s)
      setUser(s?.user ?? null)
      await loadMe(s?.access_token, { preserveOnError: Boolean(s?.access_token) })
      setLoading(false)
    },
    [loadMe]
  )

  useEffect(() => {
    clearLegacyDevSession()

    if (!isSupabaseConfigured()) {
      setSession(null)
      setUser(null)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => hydrateSession(s))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'INITIAL_SESSION') return
      void hydrateSession(s)
    })

    return () => subscription.unsubscribe()
  }, [hydrateSession])

  const signUp = async ({ email, password, fullName, phoneNumber }) => {
    if (!isSupabaseConfigured()) {
      const devUser = { id: 'dev-user', email, user_metadata: { full_name: fullName, phone_number: phoneNumber } }
      setSession({ user: devUser })
      setUser(devUser)
      return { user: devUser, error: null }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
          role: 'STUDENT',
        },
      },
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
    let signedProfile = null
    if (!error && data.session) {
      const me = await loadMe(data.session.access_token)
      isOnboarded = me.done
      signedProfile = me.profile
    }
    return { user: data.user, session: data.session, error, onboarded: isOnboarded, profile: signedProfile }
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

  const applyOnboardingComplete = useCallback((payload) => {
    setOnboarded(true)
    setMeSnapshot((prev) => ({
      ...(prev ?? {}),
      profile: prev?.profile ?? profile,
      student: payload?.student ?? prev?.student,
      studentProfile: payload?.studentProfile ?? prev?.studentProfile,
      onboarded: true,
    }))
  }, [profile])

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        meSnapshot,
        onboarded,
        loading,
        signUp,
        signIn,
        signOut,
        getAccessToken,
        refreshMe,
        applyOnboardingComplete,
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

export function getPostAuthPath(profile, onboarded) {
  if (profile?.role === 'ADMIN') return '/admin'
  return onboarded ? '/home' : '/onboarding'
}

export function isAdminProfile(profile) {
  return profile?.role === 'ADMIN'
}
