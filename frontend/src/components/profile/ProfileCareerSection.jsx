import { useState } from 'react'
import { Pencil, User } from 'lucide-react'
import ProfileCareerView from '@/components/profile/ProfileCareerView'
import ProfileCareerEditor from '@/components/profile/ProfileCareerEditor'

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

  const handleSave = async (payload) => {
    await onSave(payload)
    setTab('profile')
    onSaved?.()
  }

  return (
    <section className="rounded-xl border border-hairline bg-card-bg p-6 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-medium text-ink">Career progression</h2>
        <div className="flex gap-2">
          <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon={User}>
            Profile
          </TabButton>
          <TabButton active={tab === 'edit'} onClick={() => setTab('edit')} icon={Pencil}>
            Edit
          </TabButton>
        </div>
      </div>

      {tab === 'profile' ? (
        <ProfileCareerView me={me} />
      ) : (
        <ProfileCareerEditor me={me} onSave={handleSave} saving={saving} embedded />
      )}
    </section>
  )
}
