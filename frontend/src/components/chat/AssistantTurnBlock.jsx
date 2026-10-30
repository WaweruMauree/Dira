import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { parseAssistantContent } from '@/lib/chat/parseArtifact'
import { artifactsFromToolCalls, isArtifactTool } from '@/lib/chat/artifactFromTool'
import { formatTaskDuration } from '@/lib/chat/formatDuration'
import ChatArtifactCard from '@/components/chat/ChatArtifactCard'
import ToolCallBlock from '@/components/chat/ToolCallBlock'

export default function AssistantTurnBlock({ message, sending = false }) {
  const toolArtifacts = artifactsFromToolCalls(message.toolCalls)
  const { displayText, artifact } = parseAssistantContent(message.content, {
    toolArtifacts,
    preferToolArtifact: true,
  })
  const showArtifact = artifact && (artifact.markdown || artifact.imageUrl)
  const nonArtifactTools = (message.toolCalls ?? []).filter((tc) => !isArtifactTool(tc.name))
  const artifactPending =
    sending &&
    !message.responseDurationMs &&
    (message.toolCalls ?? []).some(
      (tc) => isArtifactTool(tc.name) && tc.status === 'pending'
    )

  const [copied, setCopied] = useState(false)
  const durationLabel = formatTaskDuration(message.responseDurationMs)

  const onCopy = async () => {
    if (!displayText) return
    try {
      await navigator.clipboard.writeText(displayText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-3 w-full">
        {(displayText || !showArtifact) && (
          <div
            className={cn(
              'rounded-2xl px-4 py-3 text-sm leading-relaxed',
              'bg-card-bg border border-hairline text-ink shadow-sm'
            )}
          >
            {displayText ? <p className="whitespace-pre-wrap">{displayText}</p> : null}
            {displayText && (
              <div className="mt-3 pt-2 border-t border-hairline/80">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-ink px-2"
                  onClick={onCopy}
                  aria-label="Copy response"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {artifactPending && !showArtifact && (
          <p className="text-sm text-muted pl-1">Preparing your document…</p>
        )}

        {showArtifact && (
          <ChatArtifactCard
            title={artifact.title}
            markdown={artifact.markdown}
            filename={artifact.filename}
            artifactType={artifact.artifactType}
            imageUrl={artifact.imageUrl}
            rows={artifact.rows}
          />
        )}

        {nonArtifactTools.map((toolCall, i) => (
          <ToolCallBlock key={`${message.id}-tool-${i}`} toolCall={toolCall} />
        ))}

        {durationLabel && (
          <p className="text-sm text-ink pl-1">Task completed in {durationLabel}</p>
        )}
      </div>
    </div>
  )
}
