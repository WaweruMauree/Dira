import { useAuth, isAdminProfile } from '@/context/AuthProvider'
import { useAdminAuth } from '@/context/AdminAuthProvider'

/**
 * Resolves which auth context powers /admin: dev secondary session, or legacy single login.
 */
export function useAdminSession() {
  const student = useAuth()
  const admin = useAdminAuth()

  const secondaryActive =
    import.meta.env.DEV && Boolean(admin.user) && isAdminProfile(admin.profile)
  const primaryActive = !secondaryActive && isAdminProfile(student.profile)

  const active = secondaryActive ? admin : primaryActive ? student : null
  const loading = student.loading || (import.meta.env.DEV ? admin.loading : false)

  return {
    user: active?.user ?? null,
    profile: active?.profile ?? null,
    loading,
    isAuthenticated: Boolean(secondaryActive || primaryActive),
    usingSecondary: secondaryActive,
    getAccessToken: secondaryActive ? admin.getAccessToken : student.getAccessToken,
    signOut: secondaryActive ? admin.signOut : student.signOut,
  }
}
