import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, isAdminProfile, getPostAuthPath } from '@/context/AuthProvider'
import { useAdminSession } from '@/hooks/useAdminSession'
import { Skeleton } from '@/components/ui/skeleton'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-ground p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

export function AdminProtectedRoute() {
  const { isAuthenticated, loading } = useAdminSession()

  if (loading) {
    return (
      <div className="min-h-screen bg-ground p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?account=admin" replace />
  }

  return <Outlet />
}

/** @deprecated use AdminProtectedRoute */
export const AdminRoute = AdminProtectedRoute

export function StudentAppGate({ requireComplete = true }) {
  const { profile, onboarded, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-ground p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isAdminProfile(profile)) {
    return <Navigate to="/admin" replace />
  }

  if (requireComplete && !onboarded) {
    return <Navigate to="/onboarding" replace />
  }

  if (!requireComplete && onboarded) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}

/** @deprecated use StudentAppGate */
export const OnboardingGate = StudentAppGate

export function PublicOnlyRoute() {
  const { user, loading, profile, onboarded } = useAuth()
  const location = useLocation()
  const isAuthForm = location.pathname === '/login' || location.pathname === '/signup'
  const profileWhenReadyRef = useRef(null)
  const capturedReadyRef = useRef(false)

  useEffect(() => {
    if (!user) {
      capturedReadyRef.current = false
      profileWhenReadyRef.current = null
      return
    }
    if (loading || capturedReadyRef.current) return
    capturedReadyRef.current = true
    profileWhenReadyRef.current = profile
  }, [user, loading, profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-ground p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const profileWhenReady = capturedReadyRef.current ? profileWhenReadyRef.current : profile
  const isAdminLogin =
    import.meta.env.DEV && new URLSearchParams(location.search).get('account') === 'admin'
  const shouldRedirect =
    user && profile && (!isAuthForm || Boolean(profileWhenReady)) && !isAdminLogin

  if (shouldRedirect) {
    return <Navigate to={getPostAuthPath(profile, onboarded)} replace />
  }

  return <Outlet />
}
