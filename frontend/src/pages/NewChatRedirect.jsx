import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getChatPath } from '@/lib/agent/tools/registry'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'

export default function NewChatRedirect({ mode }) {
  const navigate = useNavigate()
  const { chatId } = useParams()
  const { getAccessToken } = useAuth()
  const [error, setError] = useState(null)

  useEffect(() => {
    if (mode === 'career_guidance') {
      navigate('/skills-analysis', { replace: true })
      return
    }
    if (chatId && chatId !== 'new') return
    let cancelled = false
    ;(async () => {
      try {
        const token = await getAccessToken()
        if (!token) throw new Error('Not signed in')
        const { data } = await diraApi.createConversation(token, { mode })
        if (!cancelled) navigate(getChatPath(mode, data.id), { replace: true })
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to start chat')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chatId, mode, navigate, getAccessToken])

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>
  }

  return null
}
