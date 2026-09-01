import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AGENT_MODES } from '@/lib/agent/tools/registry'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'

export default function ChatHeader({ chatId, agentMode }) {
  const config = AGENT_MODES[agentMode]
  const { getAccessToken } = useAuth()
  const [title, setTitle] = useState(config.label)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const token = await getAccessToken()
      if (!token || !chatId) return
      try {
        const { data } = await diraApi.getConversation(token, chatId)
        if (!cancelled && data?.title) setTitle(data.title)
      } catch {
        /* keep default */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chatId, getAccessToken])

  return (
    <header className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-hairline bg-card-bg shrink-0">
      <Link
        to="/home"
        className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-secondary/50 text-muted hover:text-ink transition-colors"
        aria-label="Back to home"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="text-sm font-medium text-ink truncate">{title}</h1>
        <p className="text-xs text-muted truncate">{config.description}</p>
      </div>
      <Badge variant="accent">{config.label}</Badge>
    </header>
  )
}
