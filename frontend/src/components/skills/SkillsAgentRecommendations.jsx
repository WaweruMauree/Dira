import { ExternalLink } from 'lucide-react'

export default function SkillsAgentRecommendations({ groups }) {
  if (!groups?.length) {
    return (
      <p className="text-xs text-muted">
        Open the Skills Assistant to fetch YouTube and course links for your gaps (via web search).
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.query}>
          <p className="text-xs font-medium text-ink mb-1">{group.query}</p>
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
                {item.snippet && <p className="text-[11px] text-muted line-clamp-2">{item.snippet}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
