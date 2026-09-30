/**
 * Fixed positioning for menus and tooltips (fixed, so an ancestor's overflow never clips them).
 * Ported from the prototype's positionFloating: opens below the anchor when it fits, otherwise above
 * (or the reverse with `prefer: 'above'`), and is kept inside the viewport horizontally.
 */
export function positionFloating(
  element: HTMLElement,
  anchor: Element,
  { align = 'end', gap = 6, prefer = 'below' }: { align?: 'start' | 'center' | 'end'; gap?: number; prefer?: 'below' | 'above' } = {},
) {
  const anchorRect = anchor.getBoundingClientRect()
  const box = element.getBoundingClientRect()
  const margin = 8
  const fitsBelow = anchorRect.bottom + gap + box.height <= window.innerHeight - margin
  const fitsAbove = anchorRect.top - gap - box.height >= margin
  const below = prefer === 'below' ? fitsBelow || !fitsAbove : !fitsAbove && fitsBelow
  const top = below ? anchorRect.bottom + gap : anchorRect.top - gap - box.height
  let left: number
  if (align === 'center') left = anchorRect.left + anchorRect.width / 2 - box.width / 2
  else if (align === 'start') left = anchorRect.left
  else left = anchorRect.right - box.width
  left = Math.min(Math.max(left, margin), window.innerWidth - box.width - margin)
  element.style.top = `${Math.round(top)}px`
  element.style.left = `${Math.round(left)}px`
}
