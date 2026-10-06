import { Archive, ArchiveRestore, ChartColumn, ExternalLink, Link as LinkIcon, Package, Pencil, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { money, number } from '../../../shared/lib/format'
import { Menu, PageTypeBadge, StatusBadge, UrlPill, pageStatusKey, pageTypeKey } from '../../../shared/ui/ledger'
import type { MenuItem } from '../../../shared/ui/ledger'
import { pageCover } from '../model/page-cover'
import type { LandingPage } from '../model/types'

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
  const archived = page.status === 'Archived'
  const cover = pageCover(page)

  const items: MenuItem[] = [
    { label: 'Edit', icon: Pencil, to: `${analyticsUrl}/edit` },
    { label: 'Analytics', icon: ChartColumn, to: analyticsUrl },
    {
      label: 'Open public page',
      icon: ExternalLink,
      href: publicPath,
      external: true,
      disabledReason: page.status === 'Published' ? undefined : 'Publish the page to open it.',
    },
    { label: 'Copy link', icon: LinkIcon, onSelect: onCopyLink },
    'separator',
    ...(archived
      ? [{ label: 'Restore', icon: ArchiveRestore, onSelect: onRestore, disabled: busy } satisfies MenuItem]
      : [
          {
            label: page.status === 'Published' ? 'Unpublish' : 'Publish',
            icon: Rocket,
            onSelect: onTogglePublish,
            disabled: busy,
          } satisfies MenuItem,
          { label: 'Archive', icon: Archive, onSelect: onArchive, tone: 'danger', disabled: busy } satisfies MenuItem,
        ]),
  ]

  return (
    <article className="card card--interactive" aria-busy={busy || undefined}>
      <div className="card__body stack stack--md">
        <div className={cover.className} style={cover.style} />
        <div className="cluster cluster--between">
          <div className="cluster cluster--sm">
            <PageTypeBadge type={pageTypeKey(page.type)} />
            <StatusBadge kind="page" value={pageStatusKey(page.status)} />
          </div>
          <Menu label={`Actions for ${page.title}`} items={items} />
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
