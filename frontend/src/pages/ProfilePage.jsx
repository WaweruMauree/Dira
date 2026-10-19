import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import UserAvatar from '@/components/profile/UserAvatar'
import AvatarPicker from '@/components/profile/AvatarPicker'
import { useStudentProfile } from '@/hooks/useStudentProfile'
import { generateAboutFromMe, getDisplayName } from '@/lib/profile/generateAbout'
import ProfileCareerSection from '@/components/profile/ProfileCareerSection'

const READINESS_PILL = {
  EXPLORING: 'Exploring',
  PREPARING: 'Preparing',
  APPLYING: 'Applying',
  READY: 'Ready',
}

export default function ProfilePage() {
  const { me, loading, uploading, updateBio, updateJazzicon, uploadAvatar, updateCareerDetails, savingCareer, refresh } =
    useStudentProfile()
  const [editingAbout, setEditingAbout] = useState(false)
  const [aboutDraft, setAboutDraft] = useState('')
  const [savingAbout, setSavingAbout] = useState(false)

  const suggestedAbout = useMemo(() => (me ? generateAboutFromMe(me) : ''), [me])
  const displayAbout = me?.studentProfile?.bio?.trim() || suggestedAbout

  if (loading) {
    return (
      <div className="p-10 text-center text-muted text-sm">Loading your profile…</div>
    )
  }

  if (!me) {
    return (
      <div className="p-10 text-center text-muted text-sm">Sign in to view your profile.</div>
    )
  }

  const displayName = getDisplayName(me)
  const completeness = me.studentProfile?.profile_completeness ?? 0
  const readiness = me.studentProfile?.career_readiness

  const startEditAbout = () => {
    setAboutDraft(me.studentProfile?.bio?.trim() || suggestedAbout)
    setEditingAbout(true)
  }

  const saveAbout = async () => {
    setSavingAbout(true)
    try {
      await updateBio(aboutDraft.trim())
      setEditingAbout(false)
      toast.success('About updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSavingAbout(false)
    }
  }

  const useSuggestedAbout = async () => {
    setSavingAbout(true)
    try {
      await updateBio(suggestedAbout)
      setEditingAbout(false)
      toast.success('About saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSavingAbout(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-accent/15 via-card-bg to-card-bg p-8 shadow-card">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <UserAvatar profile={me.profile} size={88} className="ring-4 ring-card-bg shadow-lg" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold mb-1">
              Your profile
            </p>
            <h1 className="font-heading text-3xl font-medium text-ink truncate">{displayName}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              {me.student?.course && <Badge variant="accent">{me.student.course}</Badge>}
              {me.studentProfile?.year_of_study && (
                <Badge variant="outline">Year {me.studentProfile.year_of_study}</Badge>
              )}
              {readiness && (
                <Badge variant="outline">{READINESS_PILL[readiness] ?? readiness}</Badge>
              )}
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="font-mono text-xl font-semibold text-accent">{completeness}%</p>
            <p className="text-xs text-muted">Profile complete</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-hairline bg-card-bg p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-medium text-ink">About</h2>
          {!editingAbout && (
            <Button variant="outline" size="sm" onClick={startEditAbout}>
              Edit
            </Button>
          )}
        </div>
        {editingAbout ? (
          <div className="space-y-3">
            <Textarea
              value={aboutDraft}
              onChange={(e) => setAboutDraft(e.target.value)}
              rows={5}
              className="resize-y min-h-[120px]"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="accent" size="sm" disabled={savingAbout} onClick={saveAbout}>
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingAbout(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink/90 leading-relaxed">{displayAbout}</p>
            {!me.studentProfile?.bio?.trim() && (
              <Button variant="outline" size="sm" disabled={savingAbout} onClick={useSuggestedAbout}>
                Use this About
              </Button>
            )}
          </>
        )}
      </section>

      <section className="rounded-xl border border-hairline bg-card-bg p-6 shadow-card">
        <h2 className="font-heading text-lg font-medium text-ink mb-2">Programme</h2>
        <p className="text-sm text-muted">
          Course: <span className="text-ink font-medium">{me.student?.course || '-'}</span>
        </p>
      </section>

      <ProfileCareerSection
        me={me}
        onSave={updateCareerDetails}
        saving={savingCareer}
        onSaved={refresh}
      />

      <AvatarPicker
        userId={me.profile.id}
        profile={me.profile}
        uploading={uploading}
        onSelectJazzicon={updateJazzicon}
        onUploadPhoto={uploadAvatar}
      />
    </div>
  )
}
