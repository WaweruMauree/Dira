import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ChatPanel from '@/components/chat/ChatPanel'
import { AGENT_MODES } from '@/lib/agent/tools/registry'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'
import { buildSkillsAnalysisSummary } from '@/hooks/useSkillsAnalysis'

export default function SkillsAnalysisChatPopup({
  reportsByInterest,
  onToolComplete,
  autoPromptReady,
}) {
  const { getAccessToken } = useAuth()
  const [open, setOpen] = useState(false)
  const [chatId, setChatId] = useState(null)
  const [booting, setBooting] = useState(false)
  const autoSentRef = useRef(false)

  const config = AGENT_MODES.career_guidance
  const summary = buildSkillsAnalysisSummary(reportsByInterest)

  useEffect(() => {
    if (!open || chatId) return
    let cancelled = false
    ;(async () => {
      setBooting(true)
      try {
        const token = await getAccessToken()
        if (!token || cancelled) return
        const { data } = await diraApi.createConversation(token, { mode: 'career_guidance' })
        if (!cancelled) setChatId(data.id)
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, chatId, getAccessToken])

  const autoSendOnce =
    autoPromptReady && summary.length > 0
      ? {
          message:
            'Using my skills analysis summary, run webSearch for up to five gap or upskill skills. Find free YouTube tutorials or reputable online courses. Return concrete links only.',
          profileContext: { skillsAnalysisSummary: summary },
        }
      : null

  return (
    <>
      <Button
        type="button"
        variant="accent"
        size="icon"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
        aria-label="Open skills analysis assistant"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
          <div
            className="pointer-events-auto w-full max-w-md h-[min(560px,calc(100vh-6rem))] flex flex-col rounded-2xl border border-hairline bg-card-bg shadow-2xl overflow-hidden"
            role="dialog"
            aria-label="Skills analysis assistant"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-secondary/30 shrink-0">
              <div>
                <p className="font-medium text-sm text-ink">Skills Assistant</p>
                <p className="text-[11px] text-muted">Find courses and videos for your gaps</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              {booting || !chatId ? (
                <div className="flex items-center justify-center h-full text-sm text-muted">
                  Starting chat…
                </div>
              ) : (
                <ChatPanel
                  chatId={chatId}
                  agentMode="career_guidance"
                  tools={config.tools}
                  welcomeMessage="Ask for course or YouTube recommendations for skills you need to build."
                  onToolComplete={onToolComplete}
                  compact
                  autoSendOnce={autoSentRef.current ? null : autoSendOnce}
                  onAutoSendComplete={() => {
                    autoSentRef.current = true
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
