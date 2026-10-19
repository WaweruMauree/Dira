import { useCallback, useEffect } from 'react'
import { useStudentAppData } from '@/context/StudentAppDataProvider'

export function useRecentChats() {
  const { home } = useStudentAppData()

  useEffect(() => {
    home.ensureChats()
    const onFocus = () => home.refreshChats()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [home.ensureChats, home.refreshChats])

  const refresh = useCallback(async () => {
    await home.refreshChats()
  }, [home])

  return { chats: home.chats, refresh }
}
