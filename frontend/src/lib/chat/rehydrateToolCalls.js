import { artifactFromToolOutput, isArtifactTool } from '@/lib/chat/artifactFromTool'
import { extractMarkdownArtifact } from '@/lib/chat/parseArtifact'
import { readCachedArtifactOutput } from '@/lib/chat/artifactCache'

function compactOutputFromSource(source) {
  if (!source) return null
  const artifact = artifactFromToolOutput(source)
  if (!artifact) return null
  return {
    title: artifact.title,
    markdown: artifact.markdown,
    filename: artifact.filename,
    artifactType: artifact.artifactType ?? 'document',
    artifact: true,
  }
}

/**
 * @param {Array<{ role: string, toolCalls?: unknown[], content?: string, [key: string]: unknown }>} messages
 * @param {string | undefined} conversationId
 */
export function rehydrateMessages(messages, conversationId) {
  return messages.map((msg) => {
    if (msg.role !== 'assistant') return msg
    return rehydrateAssistantMessage(msg, conversationId)
  })
}

/**
 * @param {Record<string, unknown>} message
 * @param {string | undefined} conversationId
 */
export function rehydrateAssistantMessage(message, conversationId) {
  const toolCalls = message.toolCalls
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return message

  const extracted = extractMarkdownArtifact(String(message.content ?? ''))
  const fallbackOutput = compactOutputFromSource(extracted)

  let changed = false
  const nextToolCalls = toolCalls.map((tc) => {
    if (!isArtifactTool(tc.name)) return tc
    if (tc.output && artifactFromToolOutput(tc.output)) return tc

    const cached =
      conversationId && tc.id ? readCachedArtifactOutput(conversationId, String(tc.id)) : null
    const output = compactOutputFromSource(cached) ?? fallbackOutput

    if (!output) return tc

    changed = true
    return {
      ...tc,
      status: tc.status === 'error' ? 'error' : 'complete',
      output,
    }
  })

  if (!changed) return message
  return { ...message, toolCalls: nextToolCalls }
}
