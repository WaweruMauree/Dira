import { GraduationCap, Wrench, Compass, MessageSquare } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const steps = [
  { num: 1, label: 'Academic Info', description: 'Course and year of study', icon: GraduationCap },
  { num: 2, label: 'Skills Assessment', description: 'Technical and soft skills', icon: Wrench },
  { num: 3, label: 'Career Direction', description: 'Interests and readiness', icon: Compass },
  { num: 4, label: 'Your voice', description: 'Job search feedback', icon: MessageSquare },
]

export default function OnboardingProgress({ currentStep, totalSteps }) {
  const progress = (currentStep / totalSteps) * 100
  const visibleSteps = steps.filter((s) => s.num <= totalSteps)

  return (
    <aside className="bg-card-bg border border-hairline rounded-xl shadow-card p-6 h-fit sticky top-6">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">Progress</p>
      <p className="font-heading text-xl font-medium text-ink mb-1">
        Step {currentStep} of {totalSteps}
      </p>
      <Progress value={progress} className="mb-6" />

      <ol className="space-y-4">
        {visibleSteps.map(({ num, label, description, icon: Icon }) => (
          <li
            key={num}
            className={cn(
              'flex gap-3 rounded-lg p-3 transition-colors',
              currentStep === num && 'bg-accent/15',
              currentStep > num && 'opacity-70'
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                currentStep >= num ? 'border-accent bg-accent/20 text-ink' : 'border-hairline text-muted'
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">{label}</p>
              <p className="text-xs text-muted">{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  )
}
