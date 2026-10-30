const MAX_TEXT_CHARS = 12_000
const MAX_IMAGE_BYTES = 400_000
const MAX_OFFICE_BYTES = 2_097_152
const PDF_MAX_PAGES = 20

export const ATTACHMENT_ACCEPT =
  'image/jpeg,image/png,image/webp,.txt,.md,.csv,.pdf,.docx,.xlsx,.xls,text/plain,text/markdown,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

/**
 * @returns {Promise<{ name: string, mime: string, kind: 'image'|'document', text?: string, dataUrl?: string }>}
 */
export async function readAttachmentFile(file) {
  const name = file.name
  const mime = file.type || 'application/octet-stream'
  const lower = name.toLowerCase()

  if (mime.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(lower)) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('Image must be under 400KB. Try a smaller photo or export as JPEG.')
    }
    const dataUrl = await readAsDataURL(file)
    return { name, mime, kind: 'image', dataUrl }
  }

  if (lower.endsWith('.doc') && !lower.endsWith('.docx')) {
    throw new Error('Legacy .doc files are not supported. Save as .docx and try again.')
  }

  const textOk =
    mime.startsWith('text/') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    lower.endsWith('.csv')
  if (textOk) {
    if (file.size > 512_000) throw new Error('Document must be under 512KB.')
    const text = (await file.text()).slice(0, MAX_TEXT_CHARS)
    return { name, mime, kind: 'document', text }
  }

  if (lower.endsWith('.docx') || mime.includes('wordprocessingml')) {
    return readDocx(file, name, mime)
  }

  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || mime.includes('spreadsheet') || mime.includes('ms-excel')) {
    return readExcel(file, name, mime)
  }

  if (lower.endsWith('.pdf') || mime === 'application/pdf') {
    return readPdf(file, name, mime)
  }

  throw new Error(
    'Supported files: images (JPEG, PNG, WebP), PDF, Word (.docx), Excel (.xlsx), and text (.txt, .md, .csv).'
  )
}

async function readDocx(file, name, mime) {
  if (file.size > MAX_OFFICE_BYTES) throw new Error('Word file must be under 2MB.')
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = (result.value || '').trim().slice(0, MAX_TEXT_CHARS)
  if (!text) throw new Error('Could not extract text from this Word file.')
  return { name, mime, kind: 'document', text }
}

async function readExcel(file, name, mime) {
  if (file.size > MAX_OFFICE_BYTES) throw new Error('Excel file must be under 2MB.')
  const XLSX = await import('xlsx')
  const arrayBuffer = await file.arrayBuffer()
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) throw new Error('This Excel file has no sheets.')
  const sheet = wb.Sheets[sheetName]
  const csv = XLSX.utils.sheet_to_csv(sheet, { FS: ',', RS: '\n' })
  const text = csv.trim().slice(0, MAX_TEXT_CHARS)
  if (!text) throw new Error('Could not extract data from this Excel file.')
  return { name, mime, kind: 'document', text }
}

async function readPdf(file, name, mime) {
  if (file.size > MAX_OFFICE_BYTES) throw new Error('PDF must be under 2MB.')
  const pdfjs = await import('pdfjs-dist')
  const workerMod = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerMod.default

  const data = new Uint8Array(await file.arrayBuffer())
  const doc = await pdfjs.getDocument({ data }).promise
  const pageCount = Math.min(doc.numPages, PDF_MAX_PAGES)
  const parts = []
  for (let i = 1; i <= pageCount; i += 1) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim()
    if (line) parts.push(line)
  }
  let text = parts.join('\n\n').trim().slice(0, MAX_TEXT_CHARS)
  if (doc.numPages > PDF_MAX_PAGES) {
    text += `\n\n[First ${PDF_MAX_PAGES} pages only.]`
  }
  if (!text) throw new Error('Could not extract text from this PDF. Try a text-based PDF or paste as .txt.')
  return { name, mime, kind: 'document', text }
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}
