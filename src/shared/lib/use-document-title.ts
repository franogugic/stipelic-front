import { useEffect } from 'react'

const FALLBACK_TITLE = 'Luma'

/**
 * Sets the tab title while the calling component is mounted and falls back to "Luma" when it unmounts,
 * so a page that sets no title never keeps the previous page's title.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title
    return () => {
      document.title = FALLBACK_TITLE
    }
  }, [title])
}
