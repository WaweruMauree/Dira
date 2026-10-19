import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

const AuthFormNoticeContext = createContext(null)

export function AuthFormNoticeProvider({ children }) {
  const location = useLocation()
  const [formNotice, setFormNoticeState] = useState(null)

  useEffect(() => {
    setFormNoticeState(null)
  }, [location.pathname])

  const setFormNotice = useCallback((notice) => {
    setFormNoticeState(notice)
  }, [])

  const clearFormNotice = useCallback(() => {
    setFormNoticeState(null)
  }, [])

  const value = useMemo(
    () => ({ formNotice, setFormNotice, clearFormNotice }),
    [formNotice, setFormNotice, clearFormNotice]
  )

  return (
    <AuthFormNoticeContext.Provider value={value}>{children}</AuthFormNoticeContext.Provider>
  )
}

export function useAuthFormNotice() {
  const ctx = useContext(AuthFormNoticeContext)
  if (!ctx) {
    throw new Error('useAuthFormNotice must be used within AuthFormNoticeProvider')
  }
  return ctx
}
