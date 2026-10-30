import { useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'
import ChatHeader from './ChatHeader'
import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'

function ChatPanelContent({
  chatId,
  agentMode,
  tools,
  welcomeMessage,
  onToolComplete,
  compact,
  allowAttachment,
  autoSendOnce,
  onAutoSendComplete,
}) {
  const { messages, sending, sendMessage } = useChat({ chatId, agentMode, tools, onToolComplete })
  const autoFired = useRef(false)

  useEffect(() => {
    if (!autoSendOnce || autoFired.current || sending) return
    autoFired.current = true
    sendMessage(autoSendOnce.message, { profileContext: autoSendOnce.profileContext }).finally(() => {
      onAutoSendComplete?.()
    })
  }, [autoSendOnce, sendMessage, sending, onAutoSendComplete])

  return (
    <div className={compact ? 'flex flex-col h-full min-h-0' : 'flex flex-col h-[calc(100vh-0px)] md:h-screen'}>
      {!compact && <ChatHeader chatId={chatId} agentMode={agentMode} />}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatMessageList messages={messages} welcomeMessage={welcomeMessage} sending={sending} />
      </div>
      <ChatInput
        onSend={sendMessage}
        sending={sending}
        allowAttachment={allowAttachment}
        placeholder={
          allowAttachment
            ? 'Describe your ideal role or ask for refinements…'
            : 'Ask anything about your career...'
        }
      />
    </div>
  )
}

export default function ChatPanel(props) {
  return <ChatPanelContent key={props.chatId} {...props} />
}
