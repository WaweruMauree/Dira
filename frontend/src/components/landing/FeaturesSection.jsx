const features = [
  {
    title: 'Adaptive Career Profiling',
    description: 'Collect and continuously refine your academic background, skills, interests, and readiness level.',
  },
  {
    title: 'Opportunity Aggregation',
    description: 'NLP pipeline that extracts and structures opportunities from formal and informal sources.',
  },
  {
    title: 'Personalised Matching',
    description: 'Hybrid ML engine delivering a ranked opportunity feed tailored to your profile.',
  },
  {
    title: 'Skills Gap Analysis',
    description: 'Compare required skills for target roles against your profile and get a prioritised plan.',
  },
  {
    title: 'Career Pathway Visualisation',
    description: 'Interactive roadmap from your current position to target roles with clear milestones.',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="max-w-[820px] mx-auto px-4 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent font-bold mb-4">
        Features
      </p>
      <h2 className="font-heading text-3xl md:text-4xl font-medium text-ink mb-10 tracking-tight">
        Five modules, one career intelligence system
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className={`bg-card-bg rounded-xl border border-hairline/50 shadow-card p-6 ${i === 0 ? 'md:col-span-2 md:flex md:items-start md:gap-6' : ''}`}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2 block">
              M{i + 1}
            </span>
            <div>
              <h3 className="font-heading text-xl font-medium text-ink mb-2">{feature.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
