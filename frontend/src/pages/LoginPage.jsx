import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, getPostAuthPath } from '@/context/AuthProvider'
import { useAdminAuth } from '@/context/AdminAuthProvider'
import { useAuthFormNotice } from '@/context/AuthFormNoticeContext'
import { clearOnboardingState } from '@/lib/storage'
import {
  AUTH_FLASH_LOGIN_SUCCESS,
  authFlashNavigationState,
  buildAuthFlash,
} from '@/lib/auth/authFlash'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isAdminLogin = import.meta.env.DEV && searchParams.get('account') === 'admin'

  const studentAuth = useAuth()
  const adminAuth = useAdminAuth()
  const { signIn, isConfigured, profile } = isAdminLogin ? adminAuth : studentAuth

  const { setFormNotice, clearFormNotice } = useAuthFormNotice()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearFormNotice()
    setLoading(true)
    const { error, onboarded: done, profile: signedProfile } = await signIn({ email, password })
    setLoading(false)

    if (error) {
      setFormNotice({ variant: 'error', message: error.message || 'Failed to sign in' })
      return
    }

    const flash = buildAuthFlash('success', AUTH_FLASH_LOGIN_SUCCESS)
    const destination = isAdminLogin ? '/admin' : getPostAuthPath(signedProfile ?? profile, done)
    navigate(destination, {
      state: authFlashNavigationState(flash),
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isAdminLogin ? 'Admin log in' : 'Log in'}</CardTitle>
        <CardDescription>
          {isAdminLogin
            ? 'Sign in to the admin dashboard.'
            : 'Access your career intelligence dashboard.'}
          {!isConfigured && ' (Dev mode - any credentials work)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearFormNotice()
              }}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearFormNotice()
              }}
              required
            />
          </div>
          <Button type="submit" variant="accent" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Log in'}
          </Button>
        </form>
        <p className="text-sm text-muted text-center mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-ink underline underline-offset-2">Sign up</Link>
        </p>
        {import.meta.env.DEV && isAdminLogin && (
          <p className="text-center mt-3">
            <Link to="/login" className="text-xs text-muted hover:text-ink underline underline-offset-2">
              Student login instead
            </Link>
          </p>
        )}
        {!isConfigured && (
          <button
            type="button"
            className="w-full mt-4 text-xs text-muted hover:text-ink underline underline-offset-2"
            onClick={() => {
              clearOnboardingState()
              setFormNotice({
                variant: 'success',
                message: 'Onboarding progress cleared - sign in to start fresh',
              })
            }}
          >
            Reset onboarding (dev)
          </button>
        )}
      </CardContent>
    </Card>
  )
}
