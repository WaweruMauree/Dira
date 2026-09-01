import { useParams } from 'react-router-dom'
import ChatPanel from '@/components/chat/ChatPanel'
import { AGENT_MODES } from '@/lib/agent/tools/registry'

export default function ChatPage() {
  const { chatId } = useParams()
  const config = AGENT_MODES.general

  return (
    <ChatPanel
      chatId={chatId}
      agentMode="general"
      tools={config.tools}
      welcomeMessage="Ask general career questions. I can search the web for current trends and advice."
    />
  )
}
