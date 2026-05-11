// Simple in-memory data cache for Supabase loads.
// Survives client-side navigation; cleared on full page reload.
// Saves invalidate the relevant key so the next load re-fetches.

type Loader<T> = () => Promise<T>

const cache = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

export async function cached<T>(key: string, loader: Loader<T>): Promise<T> {
  if (cache.has(key)) return cache.get(key) as T
  if (inflight.has(key)) return inflight.get(key) as Promise<T>
  const p = loader().then(v => {
    cache.set(key, v)
    inflight.delete(key)
    return v
  }).catch(err => {
    inflight.delete(key)
    throw err
  })
  inflight.set(key, p)
  return p as Promise<T>
}

export function invalidate(key: string) {
  cache.delete(key)
  inflight.delete(key)
}

export function setCache<T>(key: string, value: T) {
  cache.set(key, value)
}
