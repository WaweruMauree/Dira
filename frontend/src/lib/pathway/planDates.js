/** Local calendar dates as YYYY-MM-DD (no UTC drift). */

/**
 * @param {string | null | undefined} iso YYYY-MM-DD
 * @returns {Date | null}
 */
export function parseISODateLocal(iso) {
  if (!iso || typeof iso !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const date = new Date(y, mo, d)
  if (Number.isNaN(date.getTime())) return null
  return date
}

/**
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
export function formatISODateLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * End date inclusive: N weeks from start spans start through start + (N×7 − 1) days.
 * @param {string} startIso
 * @param {number} weeks
 * @returns {string | null}
 */
export function addWeeksFromStart(startIso, weeks) {
  const start = parseISODateLocal(startIso)
  const w = Number(weeks)
  if (!start || !Number.isFinite(w) || w < 1) return null
  const end = new Date(start)
  end.setDate(end.getDate() + w * 7 - 1)
  return formatISODateLocal(end)
}

/**
 * Whole weeks between start and end (inclusive span), minimum 1 if end >= start.
 * @param {string} startIso
 * @param {string} endIso
 * @returns {number | null}
 */
export function weeksBetweenDates(startIso, endIso) {
  const start = parseISODateLocal(startIso)
  const end = parseISODateLocal(endIso)
  if (!start || !end) return null
  const diffDays = Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1
  if (diffDays < 1) return null
  return Math.max(1, Math.ceil(diffDays / 7))
}

/**
 * @param {string | null | undefined} iso
 * @returns {string}
 */
export function formatDisplayDate(iso) {
  const d = parseISODateLocal(iso)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** @param {Record<string, unknown> | null | undefined} step */
export function draftFromStep(step) {
  if (!step) return {}
  return {
    id: step.id,
    suggestedDurationWeeks: step.suggestedDurationWeeks ?? undefined,
    startDate: step.startDate?.slice?.(0, 10) ?? step.startDate ?? null,
    endDate: step.endDate?.slice?.(0, 10) ?? step.endDate ?? null,
    upskillActions: step.upskillActions ?? '',
    completionKpi: step.completionKpi ?? '',
  }
}
