const ARTIFACT_FENCE = /```artifact\s*([\s\S]*?)```/gi
const MARKDOWN_FENCE = /```(?:markdown|md)?\s*([\s\S]*?)```/gi
const SANDBOX_LINK = /\[([^\]]*)\]\(\s*sandbox:[^)]+\)/gi

function looksLikeCvMarkdown(text) {
  const t = (text ?? '').trim()
  return t.startsWith('#') || t.startsWith('**')
}

function titleFromMarkdown(markdown) {
  const first = (markdown ?? '').split('\n').find((l) => l.trim())
  if (!first) return 'Document'
  const h1 = first.match(/^#\s+(.+)/)
  if (h1) return h1[1].trim()
  const bold = first.match(/^\*\*(.+)\*\*/)
  if (bold) return bold[1].trim()
  return 'Document'
}

/**
 * @param {string} content
 */
export function extractMarkdownArtifact(content) {
  if (!content || typeof content !== 'string') return null

  for (const match of content.matchAll(/```(?:markdown|md)?\s*([\s\S]*?)```/gi)) {
    const body = (match[1] ?? '').trim()
    if (looksLikeCvMarkdown(body)) {
      return {
        title: titleFromMarkdown(body),
        markdown: body,
        filename: 'document.docx',
        artifactType: 'document',
        artifact: true,
      }
    }
  }

  for (const match of content.matchAll(/```[\s\S]*?```/g)) {
    const inner = match[0].replace(/^```\w*\n?/, '').replace(/```$/, '').trim()
    if (looksLikeCvMarkdown(inner)) {
      return {
        title: titleFromMarkdown(inner),
        markdown: inner,
        filename: 'document.docx',
        artifactType: 'document',
        artifact: true,
      }
    }
  }

  return null
}

function stripSandboxLinks(text) {
  return (text ?? '')
    .replace(SANDBOX_LINK, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function stripFences(content) {
  let text = content
  let inlineArtifact = null
  let fallbackArtifact = null

  const artifactMatches = [...content.matchAll(/```artifact\s*([\s\S]*?)```/gi)]
  for (const match of artifactMatches) {
    try {
      const parsed = JSON.parse(match[1].trim())
      if (parsed && typeof parsed.markdown === 'string') {
        inlineArtifact = {
          title: parsed.title,
          markdown: parsed.markdown,
          filename: parsed.filename,
          artifactType: parsed.artifactType ?? 'document',
        }
      }
    } catch {
      /* ignore */
    }
  }
  text = text.replace(ARTIFACT_FENCE, '').trim()

  fallbackArtifact = extractMarkdownArtifact(content)

  text = text
    .replace(MARKDOWN_FENCE, (full, body) => {
      const trimmed = (body ?? '').trim()
      if (looksLikeCvMarkdown(trimmed)) return ''
      return full
    })
    .trim()

  text = text.replace(/```[\s\S]*?```/g, (block) => {
    const inner = block.replace(/^```\w*\n?/, '').replace(/```$/, '').trim()
    if (looksLikeCvMarkdown(inner)) return ''
    return block
  }).trim()

  text = stripSandboxLinks(text)

  return { displayText: text, inlineArtifact, fallbackArtifact }
}

/**
 * @param {string} content
 * @param {{ preferToolArtifact?: boolean, toolArtifacts?: unknown[], cachedArtifacts?: unknown[] }} [opts]
 */
export function parseAssistantContent(content, opts = {}) {
  const { displayText, inlineArtifact, fallbackArtifact } = stripFences(content ?? '')
  const toolArtifacts = opts.toolArtifacts ?? []
  const toolFirst = toolArtifacts.length > 0 ? toolArtifacts[0] : null
  const cached = opts.cachedArtifacts?.[0] ?? null

  if (opts.preferToolArtifact !== false && toolFirst) {
    return { displayText, inlineArtifact: null, artifact: toolFirst }
  }
  if (cached) {
    return { displayText, inlineArtifact: null, artifact: cached }
  }
  const artifact = inlineArtifact ?? fallbackArtifact
  return { displayText, inlineArtifact, artifact }
}

/** @deprecated use parseAssistantContent */
export function parseMessageArtifact(content) {
  const { displayText, inlineArtifact, fallbackArtifact } = stripFences(content ?? '')
  return { cleanContent: displayText, artifact: inlineArtifact ?? fallbackArtifact }
}
