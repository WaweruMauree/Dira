import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import { cn } from '@/lib/utils'

export function HoverCard(props) {
  return <HoverCardPrimitive.Root openDelay={200} closeDelay={100} {...props} />
}

export function HoverCardTrigger({ className, ...props }) {
  return <HoverCardPrimitive.Trigger className={cn(className)} {...props} />
}

export function HoverCardContent({ className, align = 'center', sideOffset = 6, ...props }) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 rounded-lg border border-hairline bg-card-bg p-3 text-ink shadow-card outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}
