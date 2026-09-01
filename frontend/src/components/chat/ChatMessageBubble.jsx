import { cn } from '@/lib/utils'

export default function ChatMessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-ink text-white dark:bg-accent dark:text-ink'
            : 'bg-card-bg border border-hairline text-ink shadow-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
