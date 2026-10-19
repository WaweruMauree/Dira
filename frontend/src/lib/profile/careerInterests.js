/**
 * @param {import('@/lib/api/types').MePayload | null | undefined} me
 * @returns {string[]}
 */
export function interestsFromMe(me) {
  return (me?.interests ?? [])
    .map((r) => (typeof r === 'object' && r && 'area' in r ? r.area : String(r)))
    .filter(Boolean)
}
