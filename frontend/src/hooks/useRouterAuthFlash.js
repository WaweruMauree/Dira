import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AUTH_FLASH_STATE_KEY,
  clearPendingAuthFlash,
  readPendingAuthFlash,
} from '@/lib/auth/authFlash'

const AUTO_DISMISS_MS = 8000

function flashFromLocation(location) {
  return location.state?.[AUTH_FLASH_STATE_KEY] ?? readPendingAuthFlash()
}

/**
 * @returns {{ notice: { variant: 'success' | 'error', message: string, detail?: string } | null, dismiss: () => void }}
 */
export function useRouterAuthFlash() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState(() => flashFromLocation(location))

  useLayoutEffect(() => {
    const flash = flashFromLocation(location)
    if (!flash) return

    setNotice(flash)
    clearPendingAuthFlash()

    const nextState = { ...(location.state ?? {}) }
    delete nextState[AUTH_FLASH_STATE_KEY]
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      {
        replace: true,
        state: Object.keys(nextState).length > 0 ? nextState : null,
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- consume once per navigation key
  }, [location.key, navigate])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [notice])

  const dismiss = useCallback(() => setNotice(null), [])

  return { notice, dismiss }
}
