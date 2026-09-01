import { useParams } from 'react-router-dom'
import ChatPanel from '@/components/chat/ChatPanel'
import { AGENT_MODES } from '@/lib/agent/tools/registry'

export default function CareerGuidancePage() {
  const { chatId } = useParams()
  const config = AGENT_MODES.career_guidance

  return (
    <ChatPanel
      chatId={chatId}
      agentMode="career_guidance"
      tools={config.tools}
      welcomeMessage="Ask about career paths, skills gaps, and readiness. I'll map pathways and analyze your profile."
    />
  )
}
