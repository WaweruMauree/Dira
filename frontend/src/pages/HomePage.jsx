import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Compass, Briefcase, Plus, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AGENT_MODES } from '@/lib/agent/tools/registry'
import { useRecentChats } from '@/hooks/useRecentChats'
import { useHomeChat } from '@/hooks/useHomeChat'
import SavedJobsPanel from '@/components/jobs/SavedJobsPanel'
import HomeChatHero from '@/components/home/HomeChatHero'
import HomeChatComposer from '@/components/home/HomeChatComposer'
import RecentChatsDialog from '@/components/home/RecentChatsDialog'
import ChatMessageList from '@/components/chat/ChatMessageList'

function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-accent/20 text-ink border border-accent/40'
          : 'text-muted hover:text-ink border border-transparent hover:border-hairline'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}

export default function HomePage() {
  const { chats } = useRecentChats()
  const [tab, setTab] = useState('home')
  const [chatsOpen, setChatsOpen] = useState(false)
  const [input, setInput] = useState('')
  const {
    messages,
    sending,
    sendMessage,
    startNewChat,
    loadConversation,
    interests,
    hasThread,
    fullName,
  } = useHomeChat()

  const openChatsTab = () => {
    setTab('home')
    setChatsOpen(true)
  }

  if (tab === 'saved') {
    return (
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="font-heading text-2xl font-medium text-ink">Saved jobs</h1>
          <TabButton active={false} onClick={() => setTab('home')} icon={MessageSquare}>
            Back to chat
          </TabButton>
        </div>
        <SavedJobsPanel />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center justify-between gap-3 mb-6 shrink-0">
        <div className="flex gap-2">
          <TabButton active={chatsOpen} onClick={openChatsTab} icon={MessageSquare}>
            Chats
          </TabButton>
          <TabButton active={false} onClick={() => setTab('saved')} icon={Bookmark}>
            Saved jobs
          </TabButton>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => startNewChat()}>
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => startNewChat()}>General chat</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/skills-analysis" className="flex items-center gap-2">
                <Compass className="h-4 w-4" />
                {AGENT_MODES.career_guidance.label}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {AGENT_MODES.job_aggregation.label}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {!hasThread && <HomeChatHero fullName={fullName} />}
        {hasThread && (
          <div className="flex-1 min-h-0 mb-4 -mx-2">
            <HomeChatHero fullName={fullName} compact />
            <div className="h-[min(50vh,420px)]">
              <ChatMessageList messages={messages} sending={sending} />
            </div>
          </div>
        )}
        <div className="mt-auto pt-4 shrink-0">
          <HomeChatComposer
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            disabled={false}
            sending={sending}
            interests={interests}
            showPills={!hasThread}
          />
        </div>
      </div>

      <RecentChatsDialog
        open={chatsOpen}
        chats={chats}
        onClose={() => setChatsOpen(false)}
        onSelect={loadConversation}
      />
    </div>
  )
}
