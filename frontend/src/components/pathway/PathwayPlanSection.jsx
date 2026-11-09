import { useEffect, useState } from 'react'
import { Eye, Pencil } from 'lucide-react'
import AuthInlineNotice from '@/components/auth/AuthInlineNotice'
import PathwayPlanView from '@/components/pathway/PathwayPlanView'
import PathwayPlanEditor from '@/components/pathway/PathwayPlanEditor'

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

export default function PathwayPlanSection({ step, onSavePlan, saving }) {
  const [tab, setTab] = useState('view')
  const [planNotice, setPlanNotice] = useState(null)

  useEffect(() => {
    setTab('view')
    setPlanNotice(null)
  }, [step?.id])

  const switchTab = (next) => {
    setTab(next)
    if (next === 'edit') setPlanNotice(null)
  }

  const handleSave = async (fields) => {
    try {
      await onSavePlan(fields)
      setPlanNotice({ variant: 'success', message: 'Development plan saved' })
      setTab('view')
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Could not save your plan'
      if (/not found/i.test(message)) {
        message = 'Pathway was refreshed — select this role again and try Save plan.'
      }
      setPlanNotice({ variant: 'error', message })
    }
  }

  if (!step) return null

  return (
    <div className="space-y-3 pt-4 border-t border-hairline">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-sm text-ink">Development plan</p>
        <div className="flex gap-2">
          <TabButton active={tab === 'view'} onClick={() => switchTab('view')} icon={Eye}>
            View
          </TabButton>
          <TabButton active={tab === 'edit'} onClick={() => switchTab('edit')} icon={Pencil}>
            Edit
          </TabButton>
        </div>
      </div>

      {planNotice ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="w-auto text-left"
            onClick={() => setPlanNotice(null)}
            aria-label="Dismiss message"
          >
            <AuthInlineNotice
              variant={planNotice.variant}
              message={planNotice.message}
              className="mx-0"
            />
          </button>
        </div>
      ) : null}

      {tab === 'view' ? (
        <PathwayPlanView step={step} />
      ) : (
        <PathwayPlanEditor
          step={step}
          saving={saving}
          onSave={handleSave}
          onCancel={() => switchTab('view')}
        />
      )}
    </div>
  )
}
