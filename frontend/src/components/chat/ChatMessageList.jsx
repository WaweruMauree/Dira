import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import ChatMessageBubble from './ChatMessageBubble'
import AssistantTurnBlock from './AssistantTurnBlock'

export default function ChatMessageList({ messages, welcomeMessage, sending = false }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <ScrollArea className="flex-1 h-full px-4 md:px-6">
      <div className="max-w-3xl mx-auto py-6 space-y-4 min-h-full">
        {messages.length === 0 && welcomeMessage && (
          <div className="rounded-xl border border-dashed border-hairline bg-card-bg/50 p-6 text-center">
            <p className="text-muted text-sm">{welcomeMessage}</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {message.role === 'user' && <ChatMessageBubble message={message} />}
            {message.role === 'assistant' && (
              <AssistantTurnBlock message={message} sending={sending} />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
