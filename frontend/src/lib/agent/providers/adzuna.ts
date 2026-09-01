export async function fetchAdzunaHistogram(query: string, country = 'gb') {
  const appId = import.meta.env.VITE_ADZUNA_APP_ID as string | undefined
  const appKey = import.meta.env.VITE_ADZUNA_APP_KEY as string | undefined
  if (!appId || !appKey) return null

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/histogram`)
  url.searchParams.set('app_id', appId)
  url.searchParams.set('app_key', appKey)
  url.searchParams.set('what', query)
  url.searchParams.set('content-type', 'application/json')
  const res = await fetch(url.toString())
  if (!res.ok) return null
  return (await res.json()) as { histogram?: Record<string, string> }
}
