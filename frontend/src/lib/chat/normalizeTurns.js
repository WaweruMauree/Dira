/**
 * Merge consecutive assistant rows: tool round + final prose (from DB or legacy client).
 * @param {Array<{ role: string, toolCalls?: unknown[], content?: string, [key: string]: unknown }>} messages
 */
export function normalizeTurns(messages) {
  if (!messages?.length) return []
  const out = []
  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i]
    const next = messages[i + 1]
    const hasTools = Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0
    const nextPlain =
      next?.role === 'assistant' && (!next.toolCalls || next.toolCalls.length === 0)

    if (msg.role === 'assistant' && hasTools && nextPlain) {
      out.push({
        ...msg,
        content: (next.content || msg.content || '').trim() || msg.content,
        id: next.id ?? msg.id,
        createdAt: next.createdAt ?? msg.createdAt,
      })
      i += 1
      continue
    }
    out.push(msg)
  }
  return out
}
