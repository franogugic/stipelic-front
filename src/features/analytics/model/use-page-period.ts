import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PERIODS, periodById } from './series'
import type { AnalyticsPeriod } from './types'

/** Every analytics page opens on the last 30 days. */
export const DEFAULT_PERIOD: AnalyticsPeriod = '30d'

const storeKey = (screen: string) => `cp.period.${screen}`
const isPeriod = (id: string | null): id is AnalyticsPeriod => PERIODS.some((period) => period.id === id)

function stored(screen: string): AnalyticsPeriod | null {
  try {
    const id = window.localStorage.getItem(storeKey(screen))
    return isPeriod(id) ? id : null
  } catch {
    return null
  }
}

function remember(screen: string, id: AnalyticsPeriod) {
  try {
    window.localStorage.setItem(storeKey(screen), id)
  } catch {
    // Private mode or blocked storage: the period still applies for this visit.
  }
}

/**
 * The one period of an analytics page. The URL (`?period=`) wins, so a view can be shared; otherwise the period this
 * browser last chose on that screen; otherwise the last 30 days. `screen` names the page kind (not one record), so a
 * choice carries over between, say, two products. `update` changes other URL params (metric, product) without
 * touching the period.
 */
export function usePagePeriod(screen: string) {
  const [params, setParams] = useSearchParams()
  const fromUrl = params.get('period')
  const id = isPeriod(fromUrl) ? fromUrl : (stored(screen) ?? DEFAULT_PERIOD)

  // A remembered period joins the URL, so the link in the address bar shows (and shares) what the page shows.
  useEffect(() => {
    remember(screen, id)
    if (!isPeriod(fromUrl) && id !== DEFAULT_PERIOD) {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set('period', id)
          return next
        },
        { replace: true },
      )
    }
  }, [screen, id, fromUrl, setParams])

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  const setPeriod = (next: AnalyticsPeriod) => {
    remember(screen, next)
    update({ period: next === DEFAULT_PERIOD ? null : next })
  }

  return { period: periodById(id, DEFAULT_PERIOD), setPeriod, params, update }
}
