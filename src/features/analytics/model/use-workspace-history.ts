import { useEffect, useState } from 'react'
import { getHomeSummary } from '../../orders/api/orders-api'

type Entry = { at: number; promise: Promise<boolean> }

const TTL_MS = 30_000
const cache = new Map<string, Entry>()

/** Whether anything ever happened in the workspace: an order, a page view or a subscriber. */
function loadHasHistory(slug: string) {
  const known = cache.get(slug)
  if (known && Date.now() - known.at < TTL_MS) return known.promise
  const promise = getHomeSummary(slug)
    .then((summary) => summary.paidOrderCount > 0 || summary.totalPageViews > 0 || summary.subscriberCount > 0)
    // Unknown means "assume there is": offering "Show all time" is harmless, hiding it wrongly is not.
    .catch(() => true)
  cache.set(slug, { at: Date.now(), promise })
  return promise
}

/** `false` only once we know the workspace is brand new and empty; `true` while loading or unknown. */
export function useWorkspaceHasHistory(slug: string | undefined) {
  const [state, setState] = useState<{ slug: string; value: boolean } | null>(null)

  useEffect(() => {
    if (!slug) return
    let active = true
    void loadHasHistory(slug).then((value) => active && setState({ slug, value }))
    return () => {
      active = false
    }
  }, [slug])

  return state === null || state.slug !== slug ? true : state.value
}
