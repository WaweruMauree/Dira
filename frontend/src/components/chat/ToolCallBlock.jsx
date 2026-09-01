import { Loader2 } from 'lucide-react'
import { getToolMetadata } from '@/lib/agent/tools/index'
import {
  formatToolInput,
  formatToolOutput,
  getToolStatusLabel,
} from '@/lib/agent/tools/formatToolOutput'
import { cn } from '@/lib/utils'

function StatusDot({ status }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 shrink-0 rounded-full',
        status === 'complete' && 'bg-emerald-500',
        status === 'error' && 'bg-red-500',
        status === 'pending' && 'bg-gray-400 animate-pulse'
      )}
      aria-hidden
    />
  )
}

function ToolDetailLines({ lines, className }) {
  if (!lines.length) return null
  return (
    <ul className={cn('space-y-1 text-xs text-ink leading-relaxed', className)}>
      {lines.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  )
}

export default function ToolCallBlock({ toolCall }) {
  const meta = getToolMetadata(toolCall.name)
  const Icon = meta.icon
  const isPending = toolCall.status === 'pending'

  const inputLines = formatToolInput(toolCall.name, toolCall.input)
  const outputLines = formatToolOutput(toolCall.name, toolCall.output, toolCall.input)

  return (
    <div className="rounded-xl border border-hairline bg-card-bg/80 p-4 text-sm">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="h-4 w-4 text-muted shrink-0" />}
        <span className="font-medium text-ink">{meta.label}</span>
        <div className="ml-auto flex items-center gap-2">
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted" />
          ) : (
            <StatusDot status={toolCall.status} />
          )}
          <span
            className={cn(
              'font-mono text-[10px] uppercase tracking-wider',
              toolCall.status === 'complete' && 'text-emerald-600 dark:text-emerald-400',
              toolCall.status === 'error' && 'text-red-600 dark:text-red-400',
              isPending && 'text-muted'
            )}
          >
            {getToolStatusLabel(toolCall.status)}
          </span>
        </div>
      </div>

      {inputLines.length > 0 && (
        <div className="mb-2 rounded-lg bg-secondary/30 px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">Input</p>
          <ToolDetailLines lines={inputLines} className="text-muted" />
        </div>
      )}

      {outputLines.length > 0 && (
        <div className="rounded-lg bg-accent/10 px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">Result</p>
          <ToolDetailLines lines={outputLines} />
        </div>
      )}

      {toolCall.status === 'error' && toolCall.output && typeof toolCall.output === 'object' && toolCall.output.message && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{toolCall.output.message}</p>
      )}
    </div>
  )
}
