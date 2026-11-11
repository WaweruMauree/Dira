import { useCallback, useEffect, useRef, useState } from 'react'
import { LANDING_DEMO_STEPS } from '@/components/landing/landingDemoData'
import MiniHomeScene from '@/components/landing/demo/MiniHomeScene'
import MiniJobsScene from '@/components/landing/demo/MiniJobsScene'
import MiniSkillsScene from '@/components/landing/demo/MiniSkillsScene'
import { cn } from '@/lib/utils'

const STEP_MS = 4000
const FADE_MS = 550

const SCENES = [MiniHomeScene, MiniJobsScene, MiniSkillsScene]

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return reduced
}

export default function LandingFlowDemo() {
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const scheduleTimer = useCallback(() => {
    clearTimer()
    if (reducedMotion || paused) return
    timerRef.current = setInterval(() => {
      setStep((s) => (s + 1) % SCENES.length)
    }, STEP_MS)
  }, [clearTimer, paused, reducedMotion])

  useEffect(() => {
    scheduleTimer()
    return clearTimer
  }, [scheduleTimer, clearTimer])

  const goToStep = (index) => {
    setStep(index)
    scheduleTimer()
  }

  const activeLabel = LANDING_DEMO_STEPS[step]?.label ?? ''

  return (
    <div
      className="border-t border-hairline/60"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false)
      }}
    >
      <div
        className="relative h-[268px] overflow-hidden bg-ground"
        aria-label="Product tour"
        role="region"
      >
        <div className="flex items-center gap-1.5 border-b border-hairline/40 bg-card-bg/80 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-hairline" />
          <span className="h-2 w-2 rounded-full bg-hairline" />
          <span className="h-2 w-2 rounded-full bg-hairline" />
          <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-muted">
            dira.app
          </span>
        </div>
        <div className="relative h-[calc(268px-2.25rem)]">
          {SCENES.map((Scene, index) => (
            <div
              key={LANDING_DEMO_STEPS[index].id}
              className={cn(
                'absolute inset-0 transition-opacity ease-in-out',
                step === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              )}
              style={{ transitionDuration: reducedMotion ? '0ms' : `${FADE_MS}ms` }}
              aria-hidden={step !== index}
            >
              <Scene />
            </div>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Showing {activeLabel}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-hairline/40 bg-card-bg px-4 py-3">
        {LANDING_DEMO_STEPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goToStep(index)}
            className={cn(
              'rounded-full border px-3 py-1 text-[10px] font-medium transition-colors',
              step === index
                ? 'border-accent/50 bg-accent/15 text-ink'
                : 'border-hairline text-muted hover:border-hairline hover:text-ink'
            )}
            aria-current={step === index ? 'step' : undefined}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
