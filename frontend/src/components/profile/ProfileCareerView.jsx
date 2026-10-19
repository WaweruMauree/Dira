import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { EMPTY_FIELD } from '@/constants/copyStyle'
import { skillLevelLabel } from '@/constants/skillLevels'

function interestNamesFromMe(me) {
  return (me.interests ?? []).map((r) => r.area).filter(Boolean)
}

function skillsFromMe(me) {
  const technical = []
  const soft = []
  for (const row of me.skills ?? []) {
    const name = row.skills?.name
    const cat = row.skills?.category
    const level = row.proficiency_level
    if (!name) continue
    const entry = { name, level }
    if (cat === 'TECH') technical.push(entry)
    else soft.push(entry)
  }
  return { technical, soft }
}

export default function ProfileCareerView({ me }) {
  const year = me.studentProfile?.year_of_study
  const interests = interestNamesFromMe(me)
  const { technical, soft } = skillsFromMe(me)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-muted text-xs uppercase tracking-wider font-mono">Year of study</Label>
        <p className="text-sm text-ink font-medium">{year ? `Year ${year}` : EMPTY_FIELD}</p>
      </div>

      <div className="space-y-3">
        <Label className="text-muted text-xs uppercase tracking-wider font-mono">Career interests</Label>
        {interests.length === 0 ? (
          <p className="text-sm text-muted">No interests listed yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {interests.map((item) => (
              <span
                key={item}
                className="rounded-full px-3 py-1 text-xs border border-accent/40 bg-accent/15 text-ink"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-muted text-xs uppercase tracking-wider font-mono">Technical skills</Label>
        {technical.length === 0 ? (
          <p className="text-sm text-muted">{EMPTY_FIELD}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {technical.map(({ name, level }) => (
              <Badge key={name} variant="outline" className="text-xs font-normal gap-1">
                {name}
                <span className="text-muted">· {skillLevelLabel(level)}</span>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-muted text-xs uppercase tracking-wider font-mono">Soft skills</Label>
        {soft.length === 0 ? (
          <p className="text-sm text-muted">{EMPTY_FIELD}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {soft.map(({ name, level }) => (
              <Badge key={name} variant="outline" className="text-xs font-normal gap-1">
                {name}
                <span className="text-muted">· {skillLevelLabel(level)}</span>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
