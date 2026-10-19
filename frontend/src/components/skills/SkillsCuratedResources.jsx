import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function sortResources(resources) {
  return [...resources].sort((a, b) => {
    const skillA = (a.skillName ?? '').localeCompare(b.skillName ?? '')
    if (skillA !== 0) return skillA
    return (a.title ?? '').localeCompare(b.title ?? '')
  })
}

export default function SkillsCuratedResources({ resources }) {
  if (!resources?.length) {
    return <p className="text-xs text-muted">No curated resources in catalog for these skills yet.</p>
  }

  const items = sortResources(resources)

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-xl border border-hairline bg-card-bg p-5 shadow-card hover:border-accent/40 transition-colors"
        >
          <h4 className="font-medium text-ink text-base leading-snug mb-1">{item.title}</h4>
          {item.description && (
            <p className="text-sm text-muted/90 mt-2 line-clamp-2">{item.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {item.source && (
              <Badge variant="outline" className="text-[10px] capitalize">
                {item.source}
              </Badge>
            )}
            {item.skillName && (
              <Badge variant="outline" className="text-[10px]">
                {item.skillName}
              </Badge>
            )}
          </div>
          {item.url && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-hairline">
              <Button variant="accent" size="sm" className="gap-1.5" asChild>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  View Course
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
