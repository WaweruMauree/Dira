import { cn } from '@/lib/utils'

export default function ChatMessageBubble({ message }) {
  const isUser = message.role === 'user'
  if (!isUser) return null

  return (
    <div className={cn('flex justify-end')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          'bg-ink text-white dark:bg-accent dark:text-ink'
        )}
      >
        {message.attachments?.length > 0 && (
          <ul className="mb-2 space-y-1 text-xs opacity-90">
            {message.attachments.map((a, i) => (
              <li key={`${a.name}-${i}`}>📎 {a.name}</li>
            ))}
          </ul>
        )}
        {message.content ? <p className="whitespace-pre-wrap">{message.content}</p> : null}
      </div>
    </div>
  )
}
