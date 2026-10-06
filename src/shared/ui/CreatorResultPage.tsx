import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { brandStyle } from '../lib/brand-color'

/** Luma's lime, the accent of a result page whose creator isn't known (an invalid link). */
const NEUTRAL_COLOR = '#CDF24B'

/**
 * A result page in a creator's brand (purchase success, unsubscribe) — the prototype's `creatorPage()`:
 * `.lp.lp--adaptive.lp-done` with the brand colour, the creator's logo or name in the header, the content box and
 * the "Made with Luma" credit. Without `brand` it is the neutral Luma variant: no header, the default accent.
 */
export function CreatorResultPage({
  brand,
  busy,
  children,
}: {
  brand?: { name: string; color: string | null; logoUrl: string | null }
  busy?: boolean
  children: ReactNode
}) {
  return (
    <div className="lp lp--adaptive lp-done" style={brandStyle(brand?.color || NEUTRAL_COLOR)} aria-busy={busy || undefined}>
      <header className="lp-done__brand">
        {brand &&
          (brand.logoUrl ? (
            <img className="lp-logo-img" src={brand.logoUrl} alt={brand.name} />
          ) : (
            <span className="lp__logo">{brand.name}</span>
          ))}
      </header>
      <div className="lp-done__box">{children}</div>
      <footer className="lp-done__foot">
        <Link className="lp-footer__credit" to="/">
          Made with Luma
        </Link>
      </footer>
    </div>
  )
}
