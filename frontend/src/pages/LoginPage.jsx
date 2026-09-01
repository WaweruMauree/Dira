import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth, getPostAuthPath } from '@/context/AuthProvider'
import { clearOnboardingState } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, isConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error, onboarded: done } = await signIn({ email, password })
    setLoading(false)

    if (error) {
      toast.error(error.message || 'Failed to sign in')
      return
    }

    toast.success('Welcome back!')
    navigate(getPostAuthPath(done))
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>
          Access your career intelligence dashboard.
          {!isConfigured && ' (Dev mode — any credentials work)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="accent" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Log in'}
          </Button>
        </form>
        <p className="text-sm text-muted text-center mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-ink underline underline-offset-2">Sign up</Link>
        </p>
        {!isConfigured && (
          <button
            type="button"
            className="w-full mt-4 text-xs text-muted hover:text-ink underline underline-offset-2"
            onClick={() => {
              clearOnboardingState()
              toast.success('Onboarding progress cleared — sign in to start fresh')
            }}
          >
            Reset onboarding (dev)
          </button>
        )}
      </CardContent>
    </Card>
  )
}
