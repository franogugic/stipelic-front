import { useCallback, useEffect, useRef, useState } from 'react'

export type Load<T> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; data: T; at: Date }

const LOADING = { status: 'loading' } as const

/**
 * A result per key, fetched once: going back to a key already loaded reuses it (a period, a product), and a late
 * response only ever lands on the key it was asked for. A `null` key loads nothing. `reload` fetches the current key
 * again (the "Try again" of an error state).
 */
export function useKeyedLoad<T>(key: string | null, fetcher: () => Promise<T>) {
  const [loads, setLoads] = useState<Record<string, Load<T>>>({})
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const run = useCallback((target: string) => {
    fetcherRef
      .current()
      .then((data) => setLoads((current) => ({ ...current, [target]: { status: 'success', data, at: new Date() } })))
      .catch((error: unknown) => setLoads((current) => ({ ...current, [target]: { status: 'error', error } })))
  }, [])

  const known = key !== null && key in loads
  useEffect(() => {
    if (key !== null && !known) run(key)
  }, [key, known, run])

  const reload = useCallback(() => {
    if (key === null) return
    setLoads((current) => ({ ...current, [key]: LOADING }))
    run(key)
  }, [key, run])

  const load: Load<T> = key !== null ? (loads[key] ?? LOADING) : LOADING
  return { load, reload }
}
