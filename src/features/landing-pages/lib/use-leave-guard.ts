import { useEffect, useRef } from 'react'

/**
 * Keeps unsaved work from being lost while `active`:
 * - closing or reloading the tab shows the browser's own "Leave site?" prompt;
 * - clicking an in-app link (sidebar, breadcrumbs…) is held back and handed to `onAttempt` with its path, so the
 *   page can ask first and navigate itself.
 * The app uses a plain BrowserRouter (no data router), so React Router's `useBlocker` isn't available; the
 * browser's back button is not intercepted.
 */
export function useLeaveGuard(active: boolean, onAttempt: (path: string) => void) {
  const onAttemptRef = useRef(onAttempt)
  useEffect(() => {
    onAttemptRef.current = onAttempt
  })

  useEffect(() => {
    if (!active) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href]')
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      // Same page (an in-page anchor such as a section link) is not leaving.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      event.preventDefault()
      event.stopPropagation()
      onAttemptRef.current(`${url.pathname}${url.search}${url.hash}`)
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    // Capture phase, so React Router's own link handler never sees the click.
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [active])
}
