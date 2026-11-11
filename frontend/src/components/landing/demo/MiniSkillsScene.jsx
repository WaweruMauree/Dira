import { LANDING_DEMO_SKILLS, LANDING_DEMO_STATS } from '@/components/landing/landingDemoData'

export default function MiniSkillsScene() {
  return (
    <div className="flex h-full flex-col p-4">
      <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-accent">Career development</p>
      <h3 className="font-heading text-sm font-medium text-ink">Skills Analysis</h3>
      <span className="mt-2 inline-flex rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-[10px] font-medium text-ink">
        Data Analyst Intern
      </span>
      <div className="mt-3 min-h-0 flex-1 space-y-2">
        {LANDING_DEMO_SKILLS.map((skill) => (
          <div key={skill.name} className="rounded-lg border border-hairline/60 bg-card-bg px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-ink">{skill.name}</p>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted">{skill.gap}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hairline/60">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${skill.match}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-muted">{skill.match}% role match</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center font-mono text-[9px] text-muted">
        Overall skills match {LANDING_DEMO_STATS.skillsMatch}%
      </p>
    </div>
  )
}
