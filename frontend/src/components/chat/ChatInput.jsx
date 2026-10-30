import { useState, useRef } from 'react'
import { Send, Loader2, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ATTACHMENT_ACCEPT, readAttachmentFile } from '@/lib/chat/readAttachmentFile'

export default function ChatInput({
  onSend,
  disabled,
  sending,
  allowAttachment = false,
  placeholder = 'Ask anything about your career...',
}) {
  const [value, setValue] = useState('')
  const [pending, setPending] = useState([])
  const [attachError, setAttachError] = useState(null)
  const fileRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || disabled || sending) return
    const legacyCv = pending.find((a) => a.kind === 'document' && a.text)
    onSend(value, {
      attachments: pending,
      cvExcerpt: legacyCv?.text,
      cvFileName: legacyCv?.name,
    })
    setValue('')
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

  return (
    <form onSubmit={handleSubmit} className="border-t border-hairline bg-card-bg p-3 md:p-4">
      {attachError && <p className="text-xs text-destructive mb-2 px-1">{attachError}</p>}
      {pending.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {pending.map((a, i) => (
            <div
              key={`${a.name}-${i}`}
              className="flex items-center gap-2 text-xs text-muted bg-secondary/40 rounded-md py-1.5 px-2"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[200px]">{a.name}</span>
              <button
                type="button"
                onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="max-w-3xl mx-auto flex gap-2 items-end">
        {allowAttachment && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={onFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              disabled={disabled || sending}
              aria-label="Attach file"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </>
        )}
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
          className="min-h-[44px] max-h-32 resize-none"
        />
        <Button type="submit" size="icon" variant="accent" className="shrink-0" disabled={!value.trim() || disabled || sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  )
}
