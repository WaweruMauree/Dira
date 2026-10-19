import { useRouterAuthFlash } from '@/hooks/useRouterAuthFlash'
import AuthInlineNotice from '@/components/auth/AuthInlineNotice'
import { cn } from '@/lib/utils'

/**
 * @param {{ className?: string }} props
 */
export default function RouterAuthFlashBar({ className }) {
  const { notice, dismiss } = useRouterAuthFlash()

  if (!notice) return null

  return (
    <div className={cn('w-full shrink-0 px-4 pt-4 pb-2 flex justify-center', className)}>
      <button
        type="button"
        className="w-auto text-left"
        onClick={dismiss}
        aria-label="Dismiss message"
      >
        <AuthInlineNotice
          variant={notice.variant}
          message={notice.message}
          detail={notice.detail}
        />
      </button>
    </div>
  )
}
