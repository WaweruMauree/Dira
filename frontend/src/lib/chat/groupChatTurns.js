/**
 * Groups flat chat messages into turns: one user message followed by assistant message(s).
 * @param {Array<{ id?: string, role?: string }>} messages
 * @returns {Array<{ user: object | null, assistants: object[] }>}
 */
export function groupChatTurns(messages) {
  if (!messages?.length) return []

  const turns = []

  for (const message of messages) {
    if (message.role === 'user') {
      turns.push({ user: message, assistants: [] })
      continue
    }
    if (message.role === 'assistant') {
      const last = turns[turns.length - 1]
      if (last) {
        last.assistants.push(message)
      } else {
        turns.push({ user: null, assistants: [message] })
      }
    }
  }

  return turns
}
