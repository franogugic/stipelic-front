import { Link } from 'react-router-dom'
import { money, number } from '../../../shared/lib/format'
import { PageTypeBadge, StatusBadge, pageStatusKey, pageTypeKey } from '../../../shared/ui/ledger'
import { pageCover } from '../model/page-cover'
import type { LandingPage } from '../model/types'
import { PageActionsMenu } from './PageActionsMenu'

/** The list view of the landing pages: the prototype's `pageTable()`. Rows stack on narrow screens (`table--stack`). */
export function PagesTable({
  pages,
  creatorSlug,
  currency,
  busyPageId,
  onTogglePublish,
  onArchive,
  onRestore,
  onCopyLink,
}: {
  pages: LandingPage[]
  creatorSlug: string
  currency: string
  busyPageId: string | null
  onTogglePublish: (page: LandingPage) => void
  onArchive: (page: LandingPage) => void
  onRestore: (page: LandingPage) => void
  onCopyLink: (page: LandingPage) => void
}) {
  return (
    <section className="card">
      <div className="table-wrap">
        <table className="table table--stack">
          <thead>
            <tr>
              <th scope="col">Page</th>
              <th scope="col">Type</th>
              <th scope="col">Status</th>
              <th scope="col">Product</th>
              <th scope="col" className="is-num">
                Views
              </th>
              <th scope="col" className="is-num">
                Sales
              </th>
              <th scope="col" className="is-num">
                Revenue
              </th>
              <th scope="col" className="is-num">
                Emails
              </th>
              <th scope="col" className="is-actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => {
              const cover = pageCover(page)
              const busy = busyPageId === page.publicId
              return (
                <tr key={page.publicId} className={page.status === 'Archived' ? 'is-archived' : undefined} aria-busy={busy || undefined}>
                  <td className="is-lead">
                    <div className="table__main">
                      <span className={`${cover.className} cover--thumb`} style={cover.style} />
                      <div>
                        <Link className="table__primary" to={`/app/${creatorSlug}/landing-pages/${page.publicId}`}>
                          {page.title}
                        </Link>
                        <span className="table__secondary table__url">{`${window.location.host}/p/${creatorSlug}/${page.slug}`}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Type">
                    <PageTypeBadge type={pageTypeKey(page.type)} />
                  </td>
                  <td data-label="Status">
                    <StatusBadge kind="page" value={pageStatusKey(page.status)} />
                  </td>
                  <td data-label="Product" className="text-secondary">
                    {page.productName ?? '—'}
                  </td>
                  <td data-label="Views" className="is-num">
                    {number(page.totalViews)}
                  </td>
                  <td data-label="Sales" className="is-num">
                    {number(page.purchaseCount)}
                  </td>
                  <td data-label="Revenue" className="is-num">
                    {money(page.totalRevenueCents, currency, { decimals: false })}
                  </td>
                  <td data-label="Emails" className="is-num">
                    {number(page.captureCount)}
                  </td>
                  <td className="is-actions">
                    <PageActionsMenu
                      page={page}
                      creatorSlug={creatorSlug}
                      busy={busy}
                      onTogglePublish={() => onTogglePublish(page)}
                      onArchive={() => onArchive(page)}
                      onRestore={() => onRestore(page)}
                      onCopyLink={() => onCopyLink(page)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
