import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import UserAvatar, { JazziconCanvas } from '@/components/profile/UserAvatar'

const VARIANT_COUNT = 6

export function buildJazziconSeeds(userId) {
  const base = userId || 'dira'
  return Array.from({ length: VARIANT_COUNT }, (_, i) => (i === 0 ? base : `${base}-v${i}`))
}

export default function AvatarPicker({ userId, profile, onSelectJazzicon, onUploadPhoto, uploading }) {
  const inputRef = useRef(null)
  const seeds = buildJazziconSeeds(userId)
  const activeSeed = profile?.jazzicon_seed || userId

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadPhoto) return
    await onUploadPhoto(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4 rounded-xl border border-hairline bg-card-bg p-5">
      <div>
        <Label className="text-sm font-medium">Profile photo</Label>
        <p className="text-xs text-muted mt-1">
          Default icons are unique to you. Pick a style or upload a photo (max 2MB, JPG/PNG/WebP).
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {seeds.map((seed) => {
          const selected =
            profile?.avatar_kind !== 'upload' && (activeSeed === seed || (!profile?.jazzicon_seed && seed === userId))
          return (
            <button
              key={seed}
              type="button"
              onClick={() => onSelectJazzicon?.(seed)}
              className={`rounded-full ring-2 ring-offset-2 ring-offset-card-bg transition-all ${
                selected ? 'ring-accent scale-105' : 'ring-transparent hover:ring-hairline'
              }`}
              aria-label="Choose icon style"
            >
              <JazziconCanvas seed={seed} size={48} />
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-hairline">
        <UserAvatar profile={profile} size={56} />
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Upload photo'}
          </Button>
          {profile?.avatar_kind === 'upload' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => onSelectJazzicon?.(userId)}
            >
              Back to icon
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
