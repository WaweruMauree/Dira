import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
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

export function OnboardingGate({ requireComplete = true }) {
  const { onboarded, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-ground p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (requireComplete && !onboarded) {
    return <Navigate to="/onboarding" replace />
  }

  if (!requireComplete && onboarded) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, loading, onboarded } = useAuth()

  if (loading) return null
  if (user) return <Navigate to={onboarded ? '/home' : '/onboarding'} replace />

  return <Outlet />
}
