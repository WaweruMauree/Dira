import { useRef, useState } from 'react'
import { Loader2, Paperclip, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ATTACHMENT_ACCEPT, readAttachmentFile } from '@/lib/chat/readAttachmentFile'
import ChatSamplePills from '@/components/home/ChatSamplePills'

export default function HomeChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  sending,
  interests,
  showPills = true,
}) {
  const [pending, setPending] = useState([])
  const [attachError, setAttachError] = useState(null)
  const fileRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || disabled || sending) return
    onSend(value, { attachments: pending })
    onChange('')
    setPending([])
    setAttachError(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const onFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachError(null)
    try {
      const item = await readAttachmentFile(file)
      setPending((prev) => [...prev, item])
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : 'Could not read file')
    }
    e.target.value = ''
  }

  const removeAt = (index) => {
    setPending((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-hairline bg-card-bg shadow-card p-2 md:p-3"
      >
        {attachError && <p className="text-xs text-destructive mb-2 px-2">{attachError}</p>}
        {pending.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-2">
            {pending.map((a, i) => (
              <div
                key={`${a.name}-${i}`}
                className="flex items-center gap-1.5 text-xs text-muted bg-secondary/40 rounded-lg py-1 px-2 max-w-full"
              >
                <Paperclip className="h-3 w-3 shrink-0" />
                <span className="truncate">{a.name}</span>
                <button type="button" onClick={() => removeAt(i)} aria-label="Remove attachment">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input
            ref={fileRef}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={onFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-xl"
            disabled={disabled || sending}
            aria-label="Attach file"
            onClick={() => fileRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help with your career today?"
            disabled={disabled || sending}
            rows={1}
            className="min-h-[44px] max-h-40 resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent"
          />
          <Button
            type="submit"
            size="icon"
            variant="accent"
            className="shrink-0 rounded-xl"
            disabled={!value.trim() || disabled || sending}
            aria-label="Send message"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
      {showPills && (
        <ChatSamplePills
          interests={interests}
          disabled={disabled || sending}
          onPick={(msg) => onChange(msg)}
        />
      )}
    </div>
  )
}
