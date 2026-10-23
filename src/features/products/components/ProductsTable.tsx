import { Link } from 'react-router-dom'
import { cover } from '../../../shared/lib/cover'
import { date, number } from '../../../shared/lib/format'
import { FileTypeBadge, FreeBadge, Money, StatusBadge, productStatusKey } from '../../../shared/ui/ledger'
import type { LandingPage } from '../../landing-pages/model/types'
import { fileFormatOf, isFreeProduct } from '../model/product-file'
import type { Product } from '../model/types'
import { ProductMenu } from './ProductMenu'

/**
 * Products in the prototype's `SCREENS.products` table. Rows stack into labelled blocks on narrow screens
 * (`table--stack`).
 */
export function ProductsTable({
  products,
  creatorSlug,
  currency,
  sellingPagesOf,
  busyProductId,
  restoreDisabledReason,
  onArchive,
  onRestore,
}: {
  products: Product[]
  creatorSlug: string
  currency: string
  /** A product's sales pages that are not archived. */
  sellingPagesOf: (product: Product) => LandingPage[]
  /** An action on this product is running: its menu actions are disabled until it settles. */
  busyProductId: string | null
  /** Set when restoring would exceed the plan's product limit. */
  restoreDisabledReason?: string
  onArchive: (product: Product) => void
  onRestore: (product: Product) => void
}) {
  return (
    <div className="table-wrap">
      <table className="table table--stack">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">File</th>
            <th scope="col">Status</th>
            <th scope="col" className="is-num">
              Price
            </th>
            <th scope="col" className="is-num">
              Sales
            </th>
            <th scope="col" className="is-num">
              Revenue
            </th>
            <th scope="col">Page</th>
            <th scope="col" className="is-actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const detailPath = `/app/${creatorSlug}/products/${product.publicId}`
            const archived = product.status === 'Archived'
            const busy = busyProductId === product.publicId
            const thumb = cover(product.publicId, product.thumbnailUrl)
            const pages = sellingPagesOf(product)
            const free = isFreeProduct(product)
            const format = product.fileName ? fileFormatOf(product.fileName) : null
            return (
              <tr key={product.publicId} aria-busy={busy || undefined} className={archived ? 'is-archived' : undefined}>
                <td className="is-lead">
                  <div className="table__main">
                    <span className={`${thumb.className} cover--thumb`} style={thumb.style} />
                    <div>
                      <Link className="table__primary" to={detailPath}>
                        {product.name}
                      </Link>
                      <span className="table__secondary">Updated {date(product.updatedAt)}</span>
                    </div>
                  </div>
                </td>
                <td data-label="File">{format ? <FileTypeBadge format={format} /> : <span className="text-muted">—</span>}</td>
                <td data-label="Status">
                  <StatusBadge kind="product" value={productStatusKey(product.status)} />
                </td>
                <td data-label="Price" className="is-num">
                  {free ? <FreeBadge /> : <Money amountCents={product.priceCents} currency={currency} />}
                </td>
                <td data-label="Sales" className="is-num">
                  {free ? <span className="text-muted">—</span> : number(product.paidOrderCount)}
                </td>
                <td data-label="Revenue" className="is-num">
                  {free ? <span className="text-muted">—</span> : <Money amountCents={product.revenueCents} currency={currency} />}
                </td>
                <td data-label="Page" className="text-secondary">
                  {pages.length > 0 ? pages[0].title : '—'}
                </td>
                <td className="is-actions">
                  <ProductMenu
                    product={product}
                    creatorSlug={creatorSlug}
                    sellingPage={pages.find((page) => page.status === 'Published')}
                    busy={busy}
                    restoreDisabledReason={restoreDisabledReason}
                    onArchive={onArchive}
                    onRestore={onRestore}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
