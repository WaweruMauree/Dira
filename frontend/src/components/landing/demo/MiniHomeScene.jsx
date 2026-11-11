import { Bookmark, MessageSquare } from 'lucide-react'

export default function MiniHomeScene() {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/20 px-2 py-1 text-[10px] font-medium text-ink">
          <MessageSquare className="h-3 w-3" />
          Chats
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-[10px] font-medium text-muted">
          <Bookmark className="h-3 w-3" />
          Saved jobs
        </span>
      </div>
      <p className="font-heading text-sm font-medium text-ink">Hi, Alex — what should we work on?</p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        Ask about roles, skills gaps, or your next application steps.
      </p>
      <div className="mt-auto space-y-2">
        <div className="rounded-lg border border-hairline bg-card-bg px-3 py-2 text-[10px] text-muted">
          Which internships match my data skills this semester?
        </div>
        <div className="h-8 rounded-full border border-hairline bg-card-bg px-3 text-[10px] leading-8 text-muted">
          Message Dira…
        </div>
      </div>
    </div>
  )
}
