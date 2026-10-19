import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import { useAuthFormNotice } from '@/context/AuthFormNoticeContext'
import { isSupabaseConfigured } from '@/lib/env'
import { diraApi } from '@/lib/api/dira'
import { normalizeKenyaPhone, validateKenyaNational } from '@/lib/phone/kenyaPhone'
import {
  AUTH_FLASH_SIGNUP_SUCCESS,
  authFlashNavigationState,
  buildAuthFlash,
  buildSignupConfirmFlash,
} from '@/lib/auth/authFlash'
import KenyaPhoneInput from '@/components/auth/KenyaPhoneInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const EMAIL_EXISTS = 'This email already exists'
const PHONE_REGISTERED = 'This phone number is already registered'

function mapSignUpError(error) {
  const msg = error?.message ?? ''
  if (/already registered|already exists|user already/i.test(msg)) {
    return EMAIL_EXISTS
  }
  return msg || 'Failed to sign up'
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp, isConfigured } = useAuth()
  const { setFormNotice, clearFormNotice } = useAuthFormNotice()
  const [fullName, setFullName] = useState('')
  const [phoneNational, setPhoneNational] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({ email: '', phone: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearFormNotice()
    setFieldErrors({ email: '', phone: '' })

    const phoneValidation = validateKenyaNational(phoneNational)
    if (!phoneValidation.ok) {
      setFieldErrors((prev) => ({ ...prev, phone: phoneValidation.message }))
      return
    }

    const normalizedPhone = normalizeKenyaPhone(phoneNational)
    if (!normalizedPhone) {
      setFieldErrors((prev) => ({ ...prev, phone: phoneValidation.message }))
      return
    }

    setLoading(true)
    try {
      if (isSupabaseConfigured() && isConfigured) {
        try {
          const availability = await diraApi.checkSignupAvailability({
            email: email.trim(),
            phone: normalizedPhone,
          })
          const nextErrors = { email: '', phone: '' }
          if (availability.emailTaken) nextErrors.email = EMAIL_EXISTS
          if (availability.phoneTaken) nextErrors.phone = PHONE_REGISTERED
          if (nextErrors.email || nextErrors.phone) {
            setFieldErrors(nextErrors)
            return
          }
        } catch {
          // API unavailable — fall through to Supabase signUp + error mapping
        }
      }

      const { error, session } = await signUp({
        email: email.trim(),
        password,
        fullName,
        phoneNumber: normalizedPhone,
      })

      if (error) {
        const mapped = mapSignUpError(error)
        if (mapped === EMAIL_EXISTS) {
          setFieldErrors((prev) => ({ ...prev, email: EMAIL_EXISTS }))
        } else {
          setFormNotice({ variant: 'error', message: mapped })
        }
        return
      }

      if (!session) {
        navigate('/login', { state: authFlashNavigationState(buildSignupConfirmFlash()) })
        return
      }
      navigate('/onboarding', {
        state: authFlashNavigationState(
          buildAuthFlash('success', AUTH_FLASH_SIGNUP_SUCCESS)
        ),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>
          Welcome to Dira.
          {!isConfigured && ' (Dev mode - any credentials work)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <KenyaPhoneInput
            value={phoneNational}
            onChange={(v) => {
              setPhoneNational(v)
              if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }))
              clearFormNotice()
            }}
            error={fieldErrors.phone || null}
            disabled={loading}
          />
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }))
                clearFormNotice()
              }}
              required
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
            {fieldErrors.email ? (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {fieldErrors.email}
              </p>
            ) : null}
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
              minLength={6}
            />
          </div>
          <Button type="submit" variant="accent" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>
        <p className="text-sm text-muted text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-ink underline underline-offset-2">Log in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
