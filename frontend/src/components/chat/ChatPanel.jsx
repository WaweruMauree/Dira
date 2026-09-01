import { useChat } from '@/hooks/useChat'
import ChatHeader from './ChatHeader'
import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'

function ChatPanelContent({ chatId, agentMode, tools, welcomeMessage }) {
  const { messages, sending, sendMessage } = useChat({ chatId, agentMode, tools })

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] md:h-screen">
      <ChatHeader chatId={chatId} agentMode={agentMode} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatMessageList messages={messages} welcomeMessage={welcomeMessage} />
      </div>
      <ChatInput onSend={sendMessage} sending={sending} />
    </div>
  )
}

export default function ChatPanel(props) {
  return <ChatPanelContent key={props.chatId} {...props} />
}
