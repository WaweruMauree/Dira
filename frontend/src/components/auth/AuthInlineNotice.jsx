import { cn } from '@/lib/utils'

/**
 * @param {{
 *   variant: 'success' | 'error'
 *   message: string
 *   detail?: string
 *   className?: string
 * }} props
 */
export default function AuthInlineNotice({ variant, message, detail, className }) {
  const isError = variant === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={cn(
        'rounded-xl border border-hairline bg-card-bg text-ink shadow-card px-5 py-2.5 w-fit max-w-sm mx-auto',
        className
      )}
    >
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-ink">
          {isError ? `Whoops ${message}` : message}
        </p>
        {detail ? <p className="text-sm text-muted font-normal">{detail}</p> : null}
      </div>
    </div>
  )
}
