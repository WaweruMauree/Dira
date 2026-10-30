import { firstNameFromProfile } from '@/lib/chat/samplePrompts'

export default function HomeChatHero({ fullName, compact }) {
  const first = firstNameFromProfile(fullName)
  return (
    <div className={compact ? 'mb-4 text-center' : 'mb-8 text-center'}>
      <h1 className="font-heading text-3xl md:text-4xl font-medium text-ink tracking-tight">
        Hello, {first}
      </h1>
      {!compact && (
        <p className="text-muted text-sm mt-2 max-w-md mx-auto">
          Ask about careers, CVs, learning resources, or attach a file for feedback.
        </p>
      )}
    </div>
  )
}
