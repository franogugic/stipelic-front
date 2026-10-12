import { Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { money, number } from '../../../shared/lib/format'
import { PageTypeBadge, StatusBadge, UrlPill, pageStatusKey, pageTypeKey } from '../../../shared/ui/ledger'
import { pageCover } from '../model/page-cover'
import type { LandingPage } from '../model/types'
import { PageActionsMenu } from './PageActionsMenu'

/** One landing page in the prototype's `SCREENS['landing-pages']` tile layout. */
export function LandingPageTile({
  page,
  creatorSlug,
  currency,
  busy,
  onTogglePublish,
  onArchive,
  onRestore,
  onCopyLink,
}: {
  page: LandingPage
  creatorSlug: string
  currency: string
  /** An action on this page is running: its actions are disabled until it settles. */
  busy: boolean
  onTogglePublish: () => void
  onArchive: () => void
  onRestore: () => void
  onCopyLink: () => void
}) {
  const analyticsUrl = `/app/${creatorSlug}/landing-pages/${page.publicId}`
  const publicPath = `/p/${creatorSlug}/${page.slug}`
  const cover = pageCover(page)

  return (
    <article className={`card card--interactive${page.status === 'Archived' ? ' is-archived' : ''}`} aria-busy={busy || undefined}>
      <div className="card__body stack stack--md">
        <div className={cover.className} style={cover.style} />
        <div className="cluster cluster--between">
          <div className="cluster cluster--sm">
            <PageTypeBadge type={pageTypeKey(page.type)} />
            <StatusBadge kind="page" value={pageStatusKey(page.status)} />
          </div>
          <PageActionsMenu
            page={page}
            creatorSlug={creatorSlug}
            busy={busy}
            onTogglePublish={onTogglePublish}
            onArchive={onArchive}
            onRestore={onRestore}
            onCopyLink={onCopyLink}
          />
        </div>
        <div className="stack stack--xs">
          <h2 className="section-title">
            <Link className="table__primary" to={analyticsUrl}>
              {page.title}
            </Link>
          </h2>
          <UrlPill>{`${window.location.host}${publicPath}`}</UrlPill>
          {page.productName && (
            <span className="text-sm text-muted">
              <Package className="inline-icon" aria-hidden="true" /> {page.productName}
            </span>
          )}
        </div>
        <dl className="tile__stats">
          <div className="tile__stat">
            <dt>Views</dt>
            <dd>{number(page.totalViews)}</dd>
          </div>
          <div className="tile__stat">
            <dt>Sales</dt>
            <dd>{number(page.purchaseCount)}</dd>
          </div>
          <div className="tile__stat">
            <dt>Revenue</dt>
            <dd>{money(page.totalRevenueCents, currency, { decimals: false })}</dd>
          </div>
          <div className="tile__stat">
            <dt>Emails</dt>
            <dd>{number(page.captureCount)}</dd>
          </div>
        </dl>
      </div>
    </article>
  )
}
