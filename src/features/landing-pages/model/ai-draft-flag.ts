// The AI draft banner ("AI draft — review before publishing") has no server flag in the F7-B contract, so the browser
// remembers which pages came from the AI builder. It is a convenience: with storage unavailable the banner just
// doesn't show (the placeholder-testimonials publish block does not depend on it).

const key = (pageId: string) => `cp.aiDraft.${pageId}`

export function markAiDraft(pageId: string) {
  try {
    window.localStorage.setItem(key(pageId), '1')
  } catch {
    // No banner on this device.
  }
}

export const isAiDraft = (pageId: string) => {
  try {
    return window.localStorage.getItem(key(pageId)) === '1'
  } catch {
    return false
  }
}

/** The creator has reviewed the draft (dismissed the banner or published the page). */
export function clearAiDraft(pageId: string) {
  try {
    window.localStorage.removeItem(key(pageId))
  } catch {
    // Nothing to clear.
  }
}
