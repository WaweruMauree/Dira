import { useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AGENT_MODES } from '@/lib/agent/tools/registry'

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function RecentChatsDialog({ open, chats, onClose, onSelect }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recent-chats-title"
        className="relative w-full max-w-lg max-h-[min(80vh,640px)] flex flex-col rounded-2xl border border-hairline bg-card-bg shadow-xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
          <h2 id="recent-chats-title" className="font-heading text-lg font-medium text-ink">
            Recent chats
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-secondary/50"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-60" />
              No conversations yet. Send a message below to start one.
            </div>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => {
                const config = AGENT_MODES[chat.mode] ?? AGENT_MODES.general
                return (
                  <li key={chat.id}>
                    <button
                      type="button"
                      className="w-full text-left rounded-xl px-3 py-3 hover:bg-secondary/40 transition-colors"
                      onClick={() => {
                        onSelect(chat.id)
                        onClose()
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-sm text-ink truncate">{chat.title}</span>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted truncate">{chat.preview || 'No messages yet'}</p>
                      <p className="font-mono text-[10px] text-muted uppercase tracking-wider mt-1">
                        {formatRelativeTime(chat.updatedAt)}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
