import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Compass, Briefcase, Plus, Bookmark } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AGENT_MODES, getChatPath } from '@/lib/agent/tools/registry'
import { useRecentChats } from '@/hooks/useRecentChats'
import SavedJobsPanel from '@/components/jobs/SavedJobsPanel'

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function ChatCard({ chat }) {
  const config = AGENT_MODES[chat.mode]
  const href = getChatPath(chat.mode, chat.id)

  return (
    <Link
      to={href}
      className="block bg-card-bg border border-hairline rounded-xl shadow-card p-5 hover:border-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-ink text-sm truncate">{chat.title}</h3>
        <Badge variant="outline" className="shrink-0 text-[10px]">{config.label}</Badge>
      </div>
      <p className="text-muted text-xs truncate mb-3">{chat.preview || 'No messages yet'}</p>
      <p className="font-mono text-[10px] text-muted uppercase tracking-wider">
        {formatRelativeTime(chat.updatedAt)}
      </p>
    </Link>
  )
}

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
  const [tab, setTab] = useState('chats')

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent font-bold mb-1">
            Dashboard
          </p>
          <h1 className="font-heading text-3xl font-medium text-ink">
            {tab === 'saved' ? 'Saved jobs' : 'Recent conversations'}
          </h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="accent" className="gap-2">
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/chat/new" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {AGENT_MODES.general.label}
              </Link>
            </DropdownMenuItem>
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

      <div className="flex gap-2 mb-8">
        <TabButton active={tab === 'chats'} onClick={() => setTab('chats')} icon={MessageSquare}>
          Recent conversations
        </TabButton>
        <TabButton active={tab === 'saved'} onClick={() => setTab('saved')} icon={Bookmark}>
          Saved jobs
        </TabButton>
      </div>

      {tab === 'saved' ? (
        <SavedJobsPanel />
      ) : chats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-card-bg/50 p-12 text-center">
          <MessageSquare className="h-10 w-10 text-muted mx-auto mb-4" />
          <h2 className="font-heading text-xl font-medium text-ink mb-2">No conversations yet</h2>
          <p className="text-muted text-sm mb-6 max-w-md mx-auto">
            Start a chat to get career guidance, search for jobs, or ask general career questions.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" asChild><Link to="/chat/new">General Chat</Link></Button>
            <Button variant="outline" asChild><Link to="/skills-analysis">Skills Analysis</Link></Button>
            <Button variant="accent" asChild><Link to="/jobs">Job Search</Link></Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chats.map((chat) => (
            <ChatCard key={chat.id} chat={chat} />
          ))}
        </div>
      )}
    </div>
  )
}
