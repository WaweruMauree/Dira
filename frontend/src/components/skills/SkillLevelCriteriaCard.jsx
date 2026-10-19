/**
 * @param {{ levelLabel: string, summary: string, criteria: string[] }} props
 */
export default function SkillLevelCriteriaCard({ levelLabel, summary, criteria }) {
  return (
    <div className="max-w-[240px] space-y-2">
      <p className="text-xs font-medium text-ink">{levelLabel}</p>
      {summary ? <p className="text-xs text-muted leading-snug">{summary}</p> : null}
      {criteria?.length ? (
        <ul className="list-disc pl-4 space-y-1 text-xs text-ink/90 leading-snug">
          {criteria.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
