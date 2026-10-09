import { CircleDashed, Crown, Package, Wallet } from 'lucide-react'
import type { CSSProperties } from 'react'
import { money, number, plural } from '../../../shared/lib/format'
import { Money } from '../../../shared/ui/ledger'
import type { Product } from '../model/types'

/** The overview above the catalogue: products used, revenue, best seller and what needs attention. */
export function ProductSummary({
  products,
  currency,
  planName,
  productLimit,
}: {
  /** Every product, archived ones included (their revenue still counts). */
  products: Product[]
  currency: string
  planName: string
  /** Negative or undefined: unlimited. */
  productLimit: number | undefined
}) {
  const live = products.filter((product) => product.status !== 'Archived')
  const unlimited = productLimit === undefined || productLimit < 0
  const revenue = products.reduce((total, product) => total + product.revenueCents, 0)
  const sales = products.reduce((total, product) => total + product.paidOrderCount, 0)
  const best = live
    .filter((product) => product.status === 'Active' && product.revenueCents > 0)
    .sort((a, b) => b.revenueCents - a.revenueCents)[0]
  const drafts = live.filter((product) => product.status === 'Draft')
  const withoutLink = drafts.find((product) => !product.accessUrl)

  return (
    <section className="card product-summary" aria-label="Products overview">
      <div className="product-summary__item">
        <span className="metric__label">
          <Package />
          Products
        </span>
        <span className="metric__value">
          {number(live.length)}
          <small>{unlimited ? ` on ${planName}` : ` / ${number(productLimit)} on ${planName}`}</small>
        </span>
        {!unlimited && (
          <div className="meter">
            <div
              className="meter__track"
              role="meter"
              aria-label="Products used"
              aria-valuemin={0}
              aria-valuemax={productLimit}
              aria-valuenow={live.length}
            >
              <div
                className="meter__fill"
                style={{ '--meter-value': `${(productLimit > 0 ? Math.min(100, (live.length / productLimit) * 100) : 100).toFixed(1)}%` } as CSSProperties}
              />
            </div>
          </div>
        )}
      </div>
      <div className="product-summary__item">
        <span className="metric__label">
          <Wallet />
          Revenue from products
        </span>
        <span className="metric__value">
          <Money amountCents={revenue} currency={currency} />
        </span>
        <span className="metric__meta">{plural(sales, 'sale')} · all time</span>
      </div>
      <div className="product-summary__item">
        <span className="metric__label">
          <Crown />
          Best seller
        </span>
        <span className="product-summary__name">{best ? best.name : '—'}</span>
        <span className="metric__meta">
          {best ? `${money(best.revenueCents, currency)} · ${plural(best.paidOrderCount, 'sale')}` : 'No sales yet'}
        </span>
      </div>
      <div className="product-summary__item">
        <span className="metric__label">
          <CircleDashed />
          Needs attention
        </span>
        {drafts.length > 0 ? (
          <>
            <span className="product-summary__name">{plural(drafts.length, 'draft')}</span>
            <span className="metric__meta">
              {withoutLink ? `${withoutLink.name} has no access link yet` : `${drafts[0].name} is still a draft`}
            </span>
          </>
        ) : (
          <>
            <span className="product-summary__name">All set</span>
            <span className="metric__meta">Every product is ready to sell</span>
          </>
        )}
      </div>
    </section>
  )
}

