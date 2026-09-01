import { useParams } from 'react-router-dom'
import ChatPanel from '@/components/chat/ChatPanel'
import { AGENT_MODES } from '@/lib/agent/tools/registry'

export default function JobAggregationPage() {
  const { chatId } = useParams()
  const config = AGENT_MODES.job_aggregation

  return (
    <ChatPanel
      chatId={chatId}
      agentMode="job_aggregation"
      tools={config.tools}
      welcomeMessage="Search for internships and entry-level roles. I'll look across Jobicy, Himalayas, and the web."
    />
  )
}
