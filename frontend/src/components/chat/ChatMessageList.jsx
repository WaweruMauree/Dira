import { useEffect, useMemo, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { groupChatTurns } from '@/lib/chat/groupChatTurns'
import ChatMessageBubble from './ChatMessageBubble'
import AssistantTurnBlock from './AssistantTurnBlock'
import ChatAgentStatus from './ChatAgentStatus'

export default function ChatMessageList({
  messages,
  welcomeMessage,
  sending = false,
  agentPhase = null,
}) {
  const bottomRef = useRef(null)
  const turns = useMemo(() => groupChatTurns(messages), [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, agentPhase, sending])

  return (
    <ScrollArea className="flex-1 h-full px-4 md:px-6">
      <div className="max-w-3xl mx-auto py-6 space-y-4 min-h-full">
        {messages.length === 0 && welcomeMessage && (
          <div className="rounded-xl border border-dashed border-hairline bg-card-bg/50 p-6 text-center">
            <p className="text-muted text-sm">{welcomeMessage}</p>
          </div>
        )}
        {turns.map((turn, turnIndex) => {
          const isActiveTurn = sending && turnIndex === turns.length - 1
          const turnKey = turn.user?.id ?? turn.assistants[0]?.id ?? `turn-${turnIndex}`

          return (
            <div key={turnKey} className="space-y-3">
              {turn.user ? <ChatMessageBubble message={turn.user} /> : null}
              {isActiveTurn && agentPhase ? <ChatAgentStatus phase={agentPhase} /> : null}
              {turn.assistants.map((message) => (
                <AssistantTurnBlock
                  key={message.id}
                  message={message}
                  sending={isActiveTurn && sending}
                />
              ))}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
