import { useState } from 'react'
import { Pencil, User } from 'lucide-react'
import ProfileCareerView from '@/components/profile/ProfileCareerView'
import ProfileCareerEditor from '@/components/profile/ProfileCareerEditor'
import AuthInlineNotice from '@/components/auth/AuthInlineNotice'

function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-accent/20 text-ink border border-accent/40'
          : 'text-muted hover:text-ink border border-transparent hover:border-hairline'
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}

export default function ProfileCareerSection({ me, onSave, saving, onSaved }) {
  const [tab, setTab] = useState('profile')
  const [careerNotice, setCareerNotice] = useState(null)

  const handleNotice = (notice) => {
    setCareerNotice(notice)
  }

  const switchTab = (next) => {
    setTab(next)
    if (next === 'edit') setCareerNotice(null)
  }

  const handleSave = async (payload) => {
    try {
      await onSave(payload)
      setCareerNotice({ variant: 'success', message: 'Career details updated' })
      setTab('profile')
      onSaved?.()
    } catch (err) {
      setCareerNotice({
        variant: 'error',
        message: err instanceof Error ? err.message : 'Could not save',
      })
      throw err
    }
  }

  return (
    <section className="rounded-xl border border-hairline bg-card-bg p-6 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-medium text-ink">Career progression</h2>
        <div className="flex gap-2">
          <TabButton active={tab === 'profile'} onClick={() => switchTab('profile')} icon={User}>
            Profile
          </TabButton>
          <TabButton active={tab === 'edit'} onClick={() => switchTab('edit')} icon={Pencil}>
            Edit
          </TabButton>
        </div>
      </div>

      {careerNotice ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="w-auto text-left"
            onClick={() => setCareerNotice(null)}
            aria-label="Dismiss message"
          >
            <AuthInlineNotice
              variant={careerNotice.variant}
              message={careerNotice.message}
              className="mx-0"
            />
          </button>
        </div>
      ) : null}

      {tab === 'profile' ? (
        <ProfileCareerView me={me} />
      ) : (
        <ProfileCareerEditor
          me={me}
          onSave={handleSave}
          saving={saving}
          embedded
          onNotice={handleNotice}
        />
      )}
    </section>
  )
}
