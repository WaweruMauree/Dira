import { FileSearch } from 'lucide-react'
import type { ClientToolDefinition } from '@/lib/api/types'

export const analyzeUploadedFileTool = {
  name: 'analyzeUploadedFile',
  label: 'Analyze upload',
  icon: FileSearch,
  runningLabel: 'Reading attachment...',
  completeLabel: 'Attachment summarized',
}

export const analyzeUploadedFileDefinition: ClientToolDefinition = {
  name: 'analyzeUploadedFile',
  description:
    'Summarize text from an uploaded document or describe what the student attached when document text is in profileContext.uploadedFiles.',
  parameters: {
    type: 'object',
    properties: {
      fileName: { type: 'string', description: 'Optional file name to focus on' },
      focus: { type: 'string', description: 'What to extract or summarize' },
    },
  },
}

type ToolContext = {
  profileContext?: Record<string, unknown>
  attachments?: Array<{ name?: string; text?: string; kind?: string; mime?: string }>
}

export async function executeAnalyzeUploadedFile(
  input: Record<string, unknown>,
  _token: string | null,
  ctx?: ToolContext
) {
  const fromContext = (ctx?.profileContext?.uploadedFiles ?? []) as Array<{
    name?: string
    text?: string
    kind?: string
  }>
  const fromTurn = ctx?.attachments ?? []
  const files = [...fromTurn, ...fromContext].filter(
    (f) => f && (f.text || f.kind === 'document' || f.kind === 'image')
  )
  if (!files.length) {
    return { summary: 'No uploaded files in this turn. Ask the student to attach a file first.' }
  }
  const targetName = typeof input.fileName === 'string' ? input.fileName.trim().toLowerCase() : ''
  const picked = targetName
    ? files.find((f) => (f.name ?? '').toLowerCase().includes(targetName)) ?? files[0]
    : files[0]
  if (picked.kind === 'image' && !picked.text) {
    return {
      fileName: picked.name,
      kind: 'image',
      summary:
        'Image attached. Use vision in the chat message or ask the student what they want reviewed.',
    }
  }
  const text = (picked.text ?? '').trim()
  const excerpt = text.length > 4000 ? `${text.slice(0, 4000)}…` : text
  return {
    fileName: picked.name,
    kind: picked.kind ?? 'document',
    charCount: text.length,
    excerpt,
    focus: input.focus ?? null,
  }
}
