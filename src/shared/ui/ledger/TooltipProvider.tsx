import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { positionFloating } from './floating'

/**
 * Mount once at the app root. Any element with a `data-tooltip` attribute gets a tooltip on hover and
 * focus; it hides on leave, blur, scroll, resize and Esc. There is a single `role="tooltip"` element,
 * linked to its anchor with `aria-describedby` while visible. Renders nothing until a tooltip is shown.
 */
export function TooltipProvider({ children }: { children: ReactNode }) {
  const tooltipId = useId()
  const elementRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const anchorRef = useRef<HTMLElement | null>(null)
  const previousDescribedBy = useRef<string | null>(null)

  useEffect(() => {
    const show = (next: HTMLElement) => {
      if (anchorRef.current === next) return
      release()
      previousDescribedBy.current = next.getAttribute('aria-describedby')
      next.setAttribute('aria-describedby', tooltipId)
      anchorRef.current = next
      setAnchor(next)
    }

    // Puts the anchor's own aria-describedby back and forgets it.
    function release() {
      const current = anchorRef.current
      if (!current) return
      if (previousDescribedBy.current) current.setAttribute('aria-describedby', previousDescribedBy.current)
      else current.removeAttribute('aria-describedby')
      anchorRef.current = null
      setAnchor(null)
    }

    const anchorOf = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('[data-tooltip]') : null

    const onPointerOver = (event: PointerEvent) => {
      const found = anchorOf(event.target)
      if (found) show(found)
      else release()
    }
    const onFocusIn = (event: FocusEvent) => {
      const found = anchorOf(event.target)
      if (found) show(found)
      else release()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') release()
    }

    document.addEventListener('pointerover', onPointerOver)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', release)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', release, { passive: true, capture: true })
    window.addEventListener('resize', release, { passive: true, capture: true })
    return () => {
      release()
      document.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', release)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', release, { capture: true })
      window.removeEventListener('resize', release, { capture: true })
    }
  }, [tooltipId])

  useLayoutEffect(() => {
    if (anchor && elementRef.current) {
      positionFloating(elementRef.current, anchor, { align: 'center', prefer: 'above', gap: 8 })
    }
  }, [anchor])

  return (
    <>
      {children}
      {anchor &&
        createPortal(
          <div className="tooltip" id={tooltipId} role="tooltip" ref={elementRef}>
            {anchor.dataset.tooltip}
          </div>,
          document.body,
        )}
    </>
  )
}
