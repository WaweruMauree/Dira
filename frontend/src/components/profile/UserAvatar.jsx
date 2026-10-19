import { useEffect, useRef } from 'react'
import jazzicon from '@metamask/jazzicon'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

export function hashSeedToNumber(seed) {
  const s = String(seed ?? '0')
  let h = 0
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function JazziconCanvas({ seed, size = 40, className }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.replaceChildren()
    const node = jazzicon(size, hashSeedToNumber(seed))
    el.appendChild(node)
  }, [seed, size])

  return (
    <div
      ref={ref}
      className={cn('rounded-full overflow-hidden shrink-0 bg-secondary', className)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  )
}

export default function UserAvatar({
  profile,
  size = 40,
  className,
}) {
  const seed = profile?.jazzicon_seed || profile?.id || 'dira'
  const showUpload = profile?.avatar_kind === 'upload' && profile?.avatar_url

  return (
    <AvatarPrimitive.Root
      className={cn('relative flex shrink-0 overflow-hidden rounded-full', className)}
      style={{ width: size, height: size }}
    >
      {showUpload ? (
        <AvatarPrimitive.Image
          src={profile.avatar_url}
          alt=""
          className="aspect-square h-full w-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback delayMs={showUpload ? 600 : 0} className="h-full w-full">
        <JazziconCanvas seed={seed} size={size} className="h-full w-full" />
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
