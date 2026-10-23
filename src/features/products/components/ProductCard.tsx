import { ArrowRight, CircleCheck, CircleDashed, Crown, MailPlus, PanelsTopLeft, Plus, TriangleAlert, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cover } from '../../../shared/lib/cover'
import { money, number, plural } from '../../../shared/lib/format'
import {
  Button,
  FileTypeBadge,
  FreeBadge,
  Meter,
  Money,
  Sparkline,
  StatusBadge,
  productStatusKey,
} from '../../../shared/ui/ledger'
import type { LandingPage } from '../../landing-pages/model/types'
import { nextSetupHint, setupSteps } from '../model/catalogue'
import { fileFormatOf, isFreeProduct } from '../model/product-file'
import type { Product } from '../model/types'
import { ProductMenu } from './ProductMenu'

/** One product of the grid. `featured` is the best seller: wider, with its earnings and a sparkline. */
export function ProductCard({
  product,
  creatorSlug,
  currency,
  sellingPages,
  featured,
  busy,
  restoreDisabledReason,
  onArchive,
  onRestore,
}: {
  product: Product
  creatorSlug: string
  currency: string
  /** Its sales pages that are not archived. */
  sellingPages: LandingPage[]
  featured: boolean
  busy: boolean
  restoreDisabledReason?: string
  onArchive: (product: Product) => void
  onRestore: (product: Product) => void
}) {
  const detailPath = `/app/${creatorSlug}/products/${product.publicId}`
  const draft = product.status === 'Draft'
  const archived = product.status === 'Archived'
  const steps = setupSteps(product)
  const done = steps.filter(([, ok]) => ok).length
  const art = cover(product.publicId, product.thumbnailUrl)
  const free = isFreeProduct(product)
  const format = product.fileName ? fileFormatOf(product.fileName) : null
  const sparkLabel = `${product.name} ${free ? 'sign-ups' : 'sales'}, last 6 months`
  const published = sellingPages.find((page) => page.status === 'Published')

  const classes = ['product-card', featured && 'product-card--featured', archived && 'is-archived'].filter(Boolean).join(' ')
  return (
    <article className={classes} aria-busy={busy || undefined}>
      <Link className={`product-card__media ${art.className}`} style={art.style} to={detailPath} tabIndex={-1} aria-hidden="true">
        <span className="product-card__tags">
          {format && <FileTypeBadge format={format} />}
          {free && <FreeBadge />}
          {featured && (
            <span className="badge badge--solid-accent">
              <Crown />
              Best seller
            </span>
          )}
        </span>
      </Link>
      <div className="product-card__body">
        <div className="product-card__head">
          <div className="stack stack--xs">
            <StatusBadge kind="product" value={productStatusKey(product.status)} />
            <h3 className="product-card__title">
              <Link to={detailPath}>{product.name}</Link>
            </h3>
          </div>
          <ProductMenu
            product={product}
            creatorSlug={creatorSlug}
            sellingPage={published}
            busy={busy}
            restoreDisabledReason={restoreDisabledReason}
            onArchive={onArchive}
            onRestore={onRestore}
          />
        </div>
        {product.description && <p className="product-card__desc">{product.description}</p>}
        <p className="product-card__price">
          {free ? (
            <>
              Free<span>given away for an email</span>
            </>
          ) : (
            <>
              <Money amountCents={product.priceCents} currency={currency} />
              <span>one-time</span>
            </>
          )}
        </p>
        {draft ? (
          <div className="product-setup">
            <Meter label={free ? 'Ready to give away' : 'Ready to sell'} used={done} limit={steps.length} />
            <ul className="product-setup__list" role="list">
              {steps.map(([label, ok]) => (
                <li className={ok ? 'is-done' : undefined} key={label}>
                  {ok ? <CircleCheck /> : <CircleDashed />}
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ) : free ? (
          <dl className="product-card__stats">
            <div>
              <dt>Sign-ups</dt>
              <dd>{product.signupCount === undefined ? '—' : number(product.signupCount)}</dd>
            </div>
            <div>
              <dt>This month</dt>
              <dd>{product.signupsThisMonth === undefined ? '—' : number(product.signupsThisMonth)}</dd>
            </div>
            <div className="product-card__trend">
              <dt>Last 6 months</dt>
              <dd>{product.signupsTrend && product.signupsTrend.length > 1 ? <Sparkline values={product.signupsTrend} label={sparkLabel} /> : '—'}</dd>
            </div>
          </dl>
        ) : featured ? (
          <div className="product-card__highlight">
            <span className="metric__label">
              <Wallet />
              Earned all time
            </span>
            <span className="product-card__earned">
              <Money amountCents={product.revenueCents} currency={currency} />
            </span>
            <span className="metric__meta">{plural(product.paidOrderCount, 'sale')} · trend over the last 6 months</span>
            <Sparkline values={product.salesTrend} label={sparkLabel} />
          </div>
        ) : (
          <dl className="product-card__stats">
            <div>
              <dt>Sales</dt>
              <dd>{number(product.paidOrderCount)}</dd>
            </div>
            <div>
              <dt>Revenue</dt>
              <dd>{money(product.revenueCents, currency, { decimals: false })}</dd>
            </div>
            <div className="product-card__trend">
              <dt>Last 6 months</dt>
              <dd>
                <Sparkline values={product.salesTrend} label={sparkLabel} />
              </dd>
            </div>
          </dl>
        )}
      </div>
      <footer className="product-card__foot">
        {draft ? (
          <>
            <span>
              <TriangleAlert />
              {nextSetupHint(product)}
            </span>
            <Button variant="secondary" icon={ArrowRight} to={`${detailPath}/edit`}>
              Continue setup
            </Button>
          </>
        ) : sellingPages.length > 0 ? (
          <span>
            {free ? <MailPlus /> : <PanelsTopLeft />}
            {free ? 'Given away on' : 'Sold on'}{' '}
            <Link className="link" to={`/app/${creatorSlug}/landing-pages/${sellingPages[0].publicId}`}>
              {sellingPages[0].title}
            </Link>
            {sellingPages.length > 1 ? ` +${sellingPages.length - 1}` : ''}
          </span>
        ) : (
          <>
            <span>
              <CircleDashed />
              Not on a page yet
            </span>
            {!archived && (
              <Button variant="ghost" icon={Plus} to={`/app/${creatorSlug}/landing-pages?create=1&product=${product.publicId}`}>
                Create page
              </Button>
            )}
          </>
        )}
      </footer>
    </article>
  )
}
