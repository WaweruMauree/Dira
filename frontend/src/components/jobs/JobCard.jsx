import { ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const SOURCE_LABELS = {
  himalayas: 'Himalayas',
  jobicy: 'Jobicy',
  arbeitnow: 'Arbeitnow',
  adzuna: 'Adzuna',
  remotive: 'Remotive',
}

function matchScore(job) {
  const raw = job.raw
  const score = typeof raw === 'object' && raw && 'relevanceScore' in raw ? Number(raw.relevanceScore) : 0
  return Number.isFinite(score) ? score : 0
}

function matchMeta(job) {
  const raw = job.raw
  if (typeof raw !== 'object' || !raw) return { breakdown: null }
  const breakdown = Array.isArray(raw.matchBreakdown) ? raw.matchBreakdown : null
  return { breakdown }
}

function MatchScoreBadge({ job, score }) {
  const { breakdown } = matchMeta(job)

  return (
    <div className="group/match relative">
      <Badge
        variant="accent"
        className="font-mono text-[10px] cursor-help"
        tabIndex={0}
      >
        {score}% match
      </Badge>
      <div
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-72 rounded-lg border border-hairline bg-card-bg p-3 text-left shadow-lg opacity-0 invisible group-hover/match:opacity-100 group-hover/match:visible group-focus-within/match:opacity-100 group-focus-within/match:visible transition-opacity"
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">Match score</p>
        <p className="text-sm font-medium text-ink mb-2">
          Total: {score} / 100 points
        </p>
        {breakdown?.length ? (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto text-xs text-ink/90">
            {breakdown.map((line, i) => (
              <li key={`${line.label}-${i}`} className="flex justify-between gap-2">
                <span className="min-w-0">
                  {line.detail ? `${line.label} (${line.detail})` : line.label}
                </span>
                <span className="font-mono text-accent shrink-0">+{line.points}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">
            Refresh recommendations to see match details.
          </p>
        )}
      </div>
    </div>
  )
}

export default function JobCard({ job, onToggleSaved, onApplyClick, hideSave }) {
  const score = matchScore(job)
  const sourceLabel = SOURCE_LABELS[job.source] ?? job.source

  const handleApply = () => {
    onApplyClick?.(job)
  }

  return (
    <article className="group relative rounded-xl border border-hairline bg-card-bg p-5 shadow-card hover:border-accent/40 transition-colors">
      {score > 0 && (
        <div className="absolute top-4 right-4">
          <MatchScoreBadge job={job} score={score} />
        </div>
      )}
      <div className="pr-20">
        <h3 className="font-medium text-ink text-base leading-snug mb-1">{job.title}</h3>
        <p className="text-sm text-muted">
          {job.organisation || 'Company confidential'}
          {job.location ? ` · ${job.location}` : ''}
        </p>
      </div>
      {job.description && (
        <p className="text-sm text-muted/90 mt-3 line-clamp-2">{job.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Badge variant="outline" className="text-[10px]">
          {sourceLabel}
        </Badge>
        {job.employment_type && (
          <Badge variant="outline" className="text-[10px] capitalize">
            {job.employment_type}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-hairline">
        {job.url && (
          onApplyClick ? (
            <Button variant="accent" size="sm" className="gap-1.5" onClick={handleApply}>
              Apply
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button variant="accent" size="sm" className="gap-1.5" asChild>
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                Apply
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )
        )}
        {!hideSave && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 ml-auto"
          onClick={() => onToggleSaved?.(job.id, !job.saved)}
        >
          {job.saved ? (
            <>
              <BookmarkCheck className="h-3.5 w-3.5" />
              Saved
            </>
          ) : (
            <>
              <Bookmark className="h-3.5 w-3.5" />
              Save
            </>
          )}
        </Button>
        )}
      </div>
    </article>
  )
}
