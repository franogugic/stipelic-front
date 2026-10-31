// The AI draft banner ("AI draft — review before publishing") shows while the page carries the server's `aiDraft` flag
// (set by the ai-draft endpoint, cleared on publish). Only the "Got it" dismissal is remembered in the browser; with
// storage unavailable the banner simply comes back on the next visit.

const key = (pageId: string) => `cp.aiDraftDismissed.${pageId}`

export const isAiDraftDismissed = (pageId: string) => {
  try {
    return window.localStorage.getItem(key(pageId)) === '1'
  } catch {
    return false
  }
}

export function dismissAiDraft(pageId: string) {
  try {
    window.localStorage.setItem(key(pageId), '1')
  } catch {
    // The banner returns next time.
  }
}
