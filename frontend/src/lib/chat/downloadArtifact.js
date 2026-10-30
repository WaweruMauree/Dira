import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'

function slugFilename(title, ext) {
  const base = (title || 'document')
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
  const name = base || 'document'
  return name.toLowerCase().endsWith(ext) ? name : `${name}${ext}`
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function markdownToDocxParagraphs(markdown) {
  const lines = (markdown ?? '').split('\n')
  const paragraphs = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      paragraphs.push(new Paragraph({ children: [new TextRun('')] }))
      continue
    }
    if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun(trimmed.slice(2))],
        })
      )
      continue
    }
    if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun(trimmed.slice(3))],
        })
      )
      continue
    }
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed.slice(2, -2), bold: true })],
        })
      )
      continue
    }
    if (trimmed.startsWith('- ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(`• ${trimmed.slice(2)}`)],
        })
      )
      continue
    }
    paragraphs.push(new Paragraph({ children: [new TextRun(trimmed)] }))
  }
  return paragraphs.length ? paragraphs : [new Paragraph({ children: [new TextRun('')] })]
}

async function downloadAsDocx({ title, markdown }) {
  const doc = new Document({
    sections: [{ properties: {}, children: markdownToDocxParagraphs(markdown) }],
  })
  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, slugFilename(title, '.docx'))
}

async function downloadAsXlsx({ title, markdown, rows }) {
  const XLSX = await import('xlsx')
  let sheetData
  if (Array.isArray(rows) && rows.length) {
    sheetData = rows
  } else {
    const lines = (markdown ?? '').split('\n').filter(Boolean)
    sheetData = lines.map((line) => ({ Content: line.replace(/^[-*#*\s]+/, '') }))
  }
  const ws = XLSX.utils.json_to_sheet(sheetData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  triggerDownload(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    slugFilename(title, '.xlsx')
  )
}

async function downloadAsImage({ title, imageUrl }) {
  let blob
  if (imageUrl.startsWith('data:')) {
    const res = await fetch(imageUrl)
    blob = await res.blob()
  } else {
    const res = await fetch(imageUrl)
    blob = await res.blob()
  }
  const ext = blob.type.includes('png') ? '.png' : '.jpg'
  triggerDownload(blob, slugFilename(title, ext))
}

/**
 * @param {{ title?: string, markdown?: string, artifactType?: string, imageUrl?: string, rows?: unknown[] }} artifact
 */
export function getDownloadLabel(artifactType) {
  switch (artifactType) {
    case 'spreadsheet':
      return 'Download Excel spreadsheet'
    case 'image':
      return 'Download image'
    case 'document':
    default:
      return 'Download Word document'
  }
}

export async function downloadArtifact(artifact) {
  const type = artifact.artifactType ?? 'document'
  if (type === 'image' && artifact.imageUrl) {
    await downloadAsImage(artifact)
    return
  }
  if (type === 'spreadsheet') {
    await downloadAsXlsx(artifact)
    return
  }
  await downloadAsDocx(artifact)
}
