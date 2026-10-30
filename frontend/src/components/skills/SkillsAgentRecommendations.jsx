import { ExternalLink } from 'lucide-react'

export default function SkillsAgentRecommendations({
  groups = [],
  meta,
  loading = false,
  error,
  hasDevelopmentSkills = false,
}) {
  if (loading) {
    return <p className="text-xs text-muted">Finding courses and videos…</p>
  }

  if (error) {
    return <p className="text-xs text-destructive">{error}</p>
  }

  if (meta?.unavailable) {
    return (
      <p className="text-xs text-muted">
        {meta.reason ??
          'Web search is not configured. Add EXA_API_KEY to backend/.env and restart the API.'}
      </p>
    )
  }

  if (!hasDevelopmentSkills) {
    return (
      <p className="text-xs text-muted">
        No gap or upskill skills — nothing to recommend yet.
      </p>
    )
  }

  if (!groups?.length) {
    return (
      <p className="text-xs text-muted">
        No course or video links found for these skills. Try refreshing your analysis.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.skill ?? group.query}>
          <p className="text-xs font-medium text-ink mb-1">{group.skill ?? group.query}</p>
          <ul className="space-y-1">
            {group.items.map((item, i) => (
              <li key={`${group.query}-${i}`}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline inline-flex items-center gap-1"
                >
                  {item.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {item.snippet && (
                  <p className="text-[11px] text-muted line-clamp-2">{item.snippet}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
