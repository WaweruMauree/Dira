import { cn } from '@/lib/utils'

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-2 text-sm font-medium transition-colors shrink-0',
        active
          ? 'bg-accent/20 text-ink border border-accent/40'
          : 'text-muted hover:text-ink border border-transparent hover:border-hairline'
      )}
    >
      {children}
    </button>
  )
}

export default function CareerInterestTabs({ interests, active, onSelect }) {
  if (!interests?.length) return null

  const current = active || interests[0]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {interests.map((interest) => (
        <TabButton
          key={interest}
          active={current === interest}
          onClick={() => onSelect(interest)}
        >
          {interest}
        </TabButton>
      ))}
    </div>
  )
}
