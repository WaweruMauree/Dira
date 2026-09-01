import { useState, useCallback, useEffect } from 'react'
import { diraApi } from '@/lib/api/dira'
import { useAuth } from '@/context/AuthProvider'

export function useRecentChats() {
  const { getAccessToken } = useAuth()
  const [chats, setChatsState] = useState([])

  const refresh = useCallback(async () => {
    const token = await getAccessToken()
    if (!token) {
      setChatsState([])
      return
    }
    try {
      const { data } = await diraApi.listConversations(token)
      setChatsState(
        (data ?? []).map((row) => ({
          id: row.id,
          title: row.title,
          mode: row.mode,
          updatedAt: row.updated_at,
          preview: row.preview ?? '',
        }))
      )
    } catch {
      setChatsState([])
    }
  }, [getAccessToken])

  useEffect(() => {
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [refresh])

  return { chats, refresh }
}
