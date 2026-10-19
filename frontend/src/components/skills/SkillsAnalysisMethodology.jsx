export default function SkillsAnalysisMethodology({ methodology }) {
  if (!methodology || typeof methodology !== 'object') return null

  const metrics = Array.isArray(methodology.metrics) ? methodology.metrics : []
  const dataSources = Array.isArray(methodology.dataSources) ? methodology.dataSources : []
  const limitations = Array.isArray(methodology.limitations) ? methodology.limitations : []
  const roleMatch = methodology.roleMatch

  return (
    <div className="rounded-lg border border-hairline bg-secondary/20 p-4 space-y-3 text-sm">
      {methodology.summary && <p className="text-ink/90 leading-relaxed">{methodology.summary}</p>}
      {roleMatch && (
        <p className="text-xs text-muted">
          Role match:{' '}
          <span className="text-ink">
            {roleMatch.matchedRoleTitle
              ? `"${roleMatch.matchedRoleTitle}" (${roleMatch.method})`
              : 'No catalog match'}
          </span>
        </p>
      )}
      {dataSources.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">Data sources</p>
          <ul className="list-disc pl-5 text-xs text-muted space-y-0.5">
            {dataSources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {metrics.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">Metrics</p>
          <ul className="space-y-2 text-xs">
            {metrics.map((m) => (
              <li key={m.name} className="border-l-2 border-accent/40 pl-2">
                <span className="font-medium text-ink">{m.name}</span>
                {m.rule && <span className="text-muted">, {m.rule}</span>}
                {m.appliedLabel && (
                  <span className="block text-muted">Applied: {m.appliedLabel}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {limitations.length > 0 && (
        <p className="text-[11px] text-muted italic">{limitations.join(' ')}</p>
      )}
      {Array.isArray(methodology.researchSources) && methodology.researchSources.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
            Web sources used
          </p>
          <ul className="text-xs space-y-1">
            {methodology.researchSources.map((s, idx) => (
              <li key={s.url ? `${s.url}-${idx}` : s.title ?? idx}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
