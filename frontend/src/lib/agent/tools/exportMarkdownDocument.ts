import { FileDown } from 'lucide-react'
import type { ClientToolDefinition } from '@/lib/api/types'

export const exportMarkdownDocumentTool = {
  name: 'exportMarkdownDocument',
  label: 'Export document',
  icon: FileDown,
  runningLabel: 'Preparing document...',
  completeLabel: 'Document ready',
}

export const exportMarkdownDocumentDefinition: ClientToolDefinition = {
  name: 'exportMarkdownDocument',
  description:
    'Return a downloadable Markdown document (CV, cover letter, study plan). Use after drafting content for the student.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      markdown: { type: 'string' },
      filename: { type: 'string' },
    },
    required: ['title', 'markdown'],
  },
}

export async function executeExportMarkdownDocument(input: Record<string, unknown>) {
  const title = String(input.title ?? 'Document').trim()
  const markdown = String(input.markdown ?? '').trim()
  if (!markdown) throw new Error('markdown is required')
  const filename = String(input.filename ?? `${title.replace(/\s+/g, '-').toLowerCase()}.docx`)
  const lower = filename.toLowerCase()
  const artifactType = lower.endsWith('.xlsx') ? ('spreadsheet' as const) : ('document' as const)
  const outName =
    lower.endsWith('.docx') || lower.endsWith('.xlsx') ? filename : filename.replace(/\.md$/i, '.docx')
  return {
    title,
    markdown,
    filename: outName,
    artifactType,
    artifact: true,
  }
}
