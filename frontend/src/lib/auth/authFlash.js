/** Router location.state key for one-time post-auth banners */
export const AUTH_FLASH_STATE_KEY = 'authFlash'

export const AUTH_FLASH_PENDING_STORAGE_KEY = 'dira:auth-flash-pending'
const PENDING_TTL_MS = 30_000

export const AUTH_FLASH_LOGIN_SUCCESS = 'Welcome back!'
export const AUTH_FLASH_SIGNUP_SUCCESS = 'Welcome to Dira!'
export const AUTH_FLASH_SIGNUP_CONFIRM_HINT =
  'Check your email to confirm your account before signing in.'
export const AUTH_FLASH_ONBOARDING_COMPLETE = 'Profile saved!'
export const AUTH_FLASH_SESSION_EXPIRED = 'Your session expired. Please sign in again.'
export const AUTH_FLASH_PROFILE_MISSING =
  'Your account is missing a profile. Sign out, then sign up again, or ask an admin to apply the Supabase schema (handle_new_user trigger).'

/**
 * @param {'success' | 'error'} variant
 * @param {string} message
 * @param {string} [detail]
 */
export function buildAuthFlash(variant, message, detail) {
  return {
    variant,
    message,
    ...(detail ? { detail } : {}),
  }
}

export function buildSignupConfirmFlash() {
  return buildAuthFlash(
    'success',
    AUTH_FLASH_SIGNUP_SUCCESS,
    AUTH_FLASH_SIGNUP_CONFIRM_HINT
  )
}

/**
 * @param {{ variant: 'success' | 'error', message: string, detail?: string }} flash
 */
export function writePendingAuthFlash(flash) {
  try {
    sessionStorage.setItem(
      AUTH_FLASH_PENDING_STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), flash })
    )
  } catch {
    /* quota */
  }
}

/** @returns {{ variant: 'success' | 'error', message: string, detail?: string } | null} */
export function readPendingAuthFlash() {
  try {
    const raw = sessionStorage.getItem(AUTH_FLASH_PENDING_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > PENDING_TTL_MS) {
      sessionStorage.removeItem(AUTH_FLASH_PENDING_STORAGE_KEY)
      return null
    }
    return parsed.flash ?? null
  } catch {
    return null
  }
}

export function clearPendingAuthFlash() {
  try {
    sessionStorage.removeItem(AUTH_FLASH_PENDING_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Persist flash for StrictMode / redirect races and return router state slice.
 * @param {{ variant: 'success' | 'error', message: string, detail?: string }} flash
 */
export function authFlashNavigationState(flash) {
  writePendingAuthFlash(flash)
  return { [AUTH_FLASH_STATE_KEY]: flash }
}
