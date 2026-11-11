import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/env'
import { diraApi } from '@/lib/api/dira'
import { AgentApiError } from '@/lib/api/client'
import { isAdminProfile } from '@/context/AuthProvider'

const AdminAuthContext = createContext(null)

const idleAdminAuth = {
  user: null,
  profile: null,
  session: null,
  loading: false,
  signIn: async () => ({ error: new Error('Admin session is only available in local dev') }),
  signOut: async () => {},
  getAccessToken: async () => null,
  isConfigured: false,
}

export function AdminAuthProvider({ children, client = supabaseAdmin }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const signOut = useCallback(async () => {
    if (!client) {
      setSession(null)
      setUser(null)
      setProfile(null)
      return
    }
    await client.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [client])

  const loadMe = useCallback(
    async (accessToken, { preserveOnError = false } = {}) => {
      if (!accessToken) {
        setProfile(null)
        return { profile: null }
      }
      try {
        const { data } = await diraApi.me(accessToken)
        setProfile(data.profile)
        return { profile: data.profile }
      } catch (err) {
        const isMissingProfile =
          err instanceof AgentApiError &&
          err.status === 403 &&
          /profile not found/i.test(err.message)

        if (isMissingProfile && client) {
          await client.auth.signOut()
          setSession(null)
          setUser(null)
          setProfile(null)
          return { profile: null }
        }

        if (preserveOnError) {
          return { profile: null }
        }
        setProfile(null)
        return { profile: null }
      }
    },
    [client]
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
    if (!client || !isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    client.auth.getSession().then(({ data: { session: s } }) => hydrateSession(s))

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, s) => {
      if (event === 'INITIAL_SESSION') return
      void hydrateSession(s)
    })

    return () => subscription.unsubscribe()
  }, [client, hydrateSession])

  const signIn = async ({ email, password }) => {
    if (!client) {
      return { error: new Error('Admin session is only available in local dev') }
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password })
    let signedProfile = null
    if (!error && data.session) {
      const me = await loadMe(data.session.access_token)
      signedProfile = me.profile
      if (!isAdminProfile(signedProfile)) {
        await client.auth.signOut()
        setSession(null)
        setUser(null)
        setProfile(null)
        return {
          error: new Error('This account is not an admin. Use student login for student accounts.'),
        }
      }
    }
    return { user: data.user, session: data.session, error, profile: signedProfile }
  }

  const getAccessToken = useCallback(async () => {
    if (!client) return null
    const { data } = await client.auth.getSession()
    return data.session?.access_token ?? null
  }, [client])

  return (
    <AdminAuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signOut,
        getAccessToken,
        isConfigured: Boolean(client) && isSupabaseConfigured(),
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  return ctx ?? idleAdminAuth
}
