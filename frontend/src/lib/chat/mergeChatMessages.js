function messageTime(msg) {
  const t = msg?.createdAt
  if (!t) return 0
  const ms = new Date(t).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

/**
 * Merge server-fetched messages with local optimistic rows. Server wins on id collision.
 * @param {object[]} serverMessages
 * @param {object[]} localMessages
 */
export function mergeChatMessages(serverMessages, localMessages) {
  const byId = new Map()
  for (const m of serverMessages ?? []) {
    if (m?.id != null) byId.set(String(m.id), m)
  }
  for (const m of localMessages ?? []) {
    if (m?.id == null) continue
    const id = String(m.id)
    if (!byId.has(id)) byId.set(id, m)
  }
  return [...byId.values()].sort((a, b) => messageTime(a) - messageTime(b))
}
