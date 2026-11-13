import { ExternalLink } from 'lucide-react'

const textSize = {
  compact: 'text-xs',
  comfortable: 'text-sm',
}

export default function SkillsAgentRecommendations({
  groups = [],
  meta,
  loading = false,
  error,
  hasDevelopmentSkills = false,
  density = 'compact',
  hideSkillHeadings = false,
}) {
  const bodyClass = textSize[density] ?? textSize.compact
  const snippetClass = density === 'comfortable' ? 'text-xs' : 'text-[11px]'
  const kindClass = density === 'comfortable' ? 'text-[10px]' : 'text-[9px]'

  if (loading) {
    return <p className={`${bodyClass} text-muted`}>Finding videos and papers…</p>
  }

  if (error) {
    return <p className={`${bodyClass} text-destructive`}>{error}</p>
  }

  if (meta?.unavailable) {
    return (
      <p className={`${bodyClass} text-muted`}>
        {meta.reason ??
          'Web search is not configured. Add EXA_API_KEY to backend/.env and restart the API.'}
      </p>
    )
  }

  if (!hasDevelopmentSkills) {
    return (
      <p className={`${bodyClass} text-muted`}>
        No gap or upskill skills — nothing to recommend yet.
      </p>
    )
  }

  if (!groups?.length) {
    return (
      <p className={`${bodyClass} text-muted`}>
        No videos, papers, or guides found for these skills. Try refreshing your analysis.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.skill ?? group.query}>
          {hideSkillHeadings ? null : (
            <p className={`${bodyClass} font-medium text-ink mb-1`}>{group.skill ?? group.query}</p>
          )}
          <ul className="space-y-1">
            {group.items.map((item, i) => (
              <li key={`${group.query}-${i}`}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${bodyClass} text-accent hover:underline inline-flex items-center gap-1`}
                >
                  {item.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {item.kind && (
                  <span className={`font-mono ${kindClass} uppercase tracking-wider text-muted`}>
                    {item.kind}
                  </span>
                )}
                {item.snippet && (
                  <p className={`${snippetClass} text-muted line-clamp-2`}>{item.snippet}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
