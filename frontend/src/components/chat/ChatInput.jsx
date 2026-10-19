import { useState, useRef } from 'react'
import { Send, Loader2, Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const MAX_ATTACHMENT_CHARS = 12_000

async function readCvFile(file) {
  if (file.size > 512_000) {
    throw new Error('File must be under 512KB.')
  }
  const name = file.name.toLowerCase()
  const ok =
    file.type.startsWith('text/') ||
    name.endsWith('.txt') ||
    name.endsWith('.md') ||
    name.endsWith('.csv')
  if (!ok) {
    throw new Error('Upload a .txt or .md CV (PDF support coming soon).')
  }
  const text = await file.text()
  return text.slice(0, MAX_ATTACHMENT_CHARS)
}

export default function ChatInput({
  onSend,
  disabled,
  sending,
  allowAttachment = false,
  placeholder = 'Ask anything about your career...',
}) {
  const [value, setValue] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [attachError, setAttachError] = useState(null)
  const fileRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || disabled || sending) return
    onSend(value, {
      cvExcerpt: attachment?.text,
      cvFileName: attachment?.name,
    })
    setValue('')
    setAttachment(null)
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
      const text = await readCvFile(file)
      setAttachment({ name: file.name, text })
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : 'Could not read file')
      setAttachment(null)
    }
    e.target.value = ''
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-hairline bg-card-bg p-3 md:p-4">
      {attachError && <p className="text-xs text-destructive mb-2 px-1">{attachError}</p>}
      {attachment && (
        <div className="flex items-center gap-2 mb-2 px-1 text-xs text-muted bg-secondary/40 rounded-md py-1.5 px-2">
          <Paperclip className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate flex-1">{attachment.name}</span>
          <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="max-w-3xl mx-auto flex gap-2 items-end">
        {allowAttachment && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.csv,text/plain,text/markdown"
              className="hidden"
              onChange={onFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              disabled={disabled || sending}
              aria-label="Attach CV"
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
          className="min-h-[48px] max-h-28 resize-none flex-1"
          disabled={disabled || sending}
        />
        <Button
          type="submit"
          variant="accent"
          size="icon"
          className="shrink-0"
          disabled={!value.trim() || disabled || sending}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  )
}
