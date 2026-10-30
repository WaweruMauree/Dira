export const ARTIFACT_TOOL_NAMES = new Set(['buildCv', 'cvBuilder', 'exportMarkdownDocument'])

export function isArtifactTool(name) {
  return ARTIFACT_TOOL_NAMES.has(String(name))
}

/**
 * @param {unknown} output
 */
export function artifactFromToolOutput(output) {
  if (!output || typeof output !== 'object') return null
  const o = output
  if (!o.artifact) return null
  if (typeof o.markdown === 'string' && o.markdown.trim()) {
    return {
      title: o.title ?? 'Document',
      markdown: o.markdown,
      filename: o.filename,
      artifactType: o.artifactType ?? 'document',
      imageUrl: o.imageUrl,
      rows: o.rows,
    }
  }
  if (o.imageUrl || o.dataUrl) {
    return {
      title: o.title ?? 'Image',
      artifactType: 'image',
      imageUrl: o.imageUrl ?? o.dataUrl,
      markdown: null,
    }
  }
  return null
}

/**
 * @param {Array<{ name?: string, output?: unknown }> | undefined} toolCalls
 */
export function artifactsFromToolCalls(toolCalls) {
  if (!Array.isArray(toolCalls)) return []
  return toolCalls
    .map((tc) => artifactFromToolOutput(tc.output))
    .filter(Boolean)
}
