const PREFIX = 'dira:artifact:'

function cacheKey(conversationId, toolCallId) {
  return `${PREFIX}${conversationId}:${toolCallId}`
}

/**
 * @param {string} conversationId
 * @param {string} toolCallId
 * @param {Record<string, unknown>} output
 */
export function cacheArtifactOutput(conversationId, toolCallId, output) {
  if (!conversationId || !toolCallId || !output?.artifact) return
  try {
    const payload = {
      title: output.title,
      markdown: output.markdown,
      filename: output.filename,
      artifactType: output.artifactType ?? 'document',
      artifact: true,
    }
    sessionStorage.setItem(cacheKey(conversationId, toolCallId), JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
}

/**
 * @param {string} conversationId
 * @param {string} toolCallId
 */
export function readCachedArtifactOutput(conversationId, toolCallId) {
  if (!conversationId || !toolCallId) return null
  try {
    const raw = sessionStorage.getItem(cacheKey(conversationId, toolCallId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}
