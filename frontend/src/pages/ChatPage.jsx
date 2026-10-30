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
      welcomeMessage="Ask career questions — I'll research the web when needed. For a CV, tell me your target role and I'll research examples, draft a Word-ready CV, and show a download card."
    />
  )
}
