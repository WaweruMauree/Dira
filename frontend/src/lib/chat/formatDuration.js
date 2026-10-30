/**
 * @param {number} ms
 */
export function formatTaskDuration(ms) {
  if (ms == null || Number.isNaN(ms) || ms < 0) return null
  if (ms < 1000) return `${Math.round(ms)}ms`
  const seconds = ms / 1000
  return `${seconds.toFixed(1)}s`
}
