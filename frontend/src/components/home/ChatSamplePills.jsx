import { getStaticSamplePrompts } from '@/lib/chat/samplePrompts'

export default function ChatSamplePills({ onPick, disabled }) {
  const prompts = getStaticSamplePrompts()
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-3 px-1">
      {prompts.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(p.message)}
          className="rounded-full border border-hairline bg-card-bg px-4 py-2 text-xs md:text-sm text-ink hover:border-accent/50 hover:bg-accent/10 transition-colors disabled:opacity-50"
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
