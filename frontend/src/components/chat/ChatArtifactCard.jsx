import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadArtifact, getDownloadLabel } from '@/lib/chat/downloadArtifact'

export default function ChatArtifactCard({ title, markdown, filename, artifactType, imageUrl, rows }) {
  const hasDoc = Boolean(markdown?.trim()) || Boolean(imageUrl)
  if (!hasDoc) return null
  const [downloading, setDownloading] = useState(false)
  const preview = markdown?.length > 400 ? `${markdown.slice(0, 400)}…` : markdown

  const onDownload = async () => {
    setDownloading(true)
    try {
      await downloadArtifact({
        title: title || filename || 'document',
        markdown,
        artifactType: artifactType ?? 'document',
        imageUrl,
        rows,
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="rounded-xl border border-hairline bg-secondary/20 p-3 text-sm max-w-[75%]">
      <div className="flex items-start gap-2 mb-2">
        <FileText className="h-4 w-4 text-accent shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink truncate">{title || 'Document'}</p>
          {preview && (
            <p className="text-xs text-muted mt-1 whitespace-pre-wrap line-clamp-4">{preview}</p>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={downloading}
        onClick={onDownload}
      >
        <Download className="h-3.5 w-3.5" />
        {getDownloadLabel(artifactType ?? 'document')}
      </Button>
    </div>
  )
}
