import { Archive, ArchiveRestore, ChartColumn, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cover } from '../../../shared/lib/cover'
import { date, number } from '../../../shared/lib/format'
import { Menu, Money, ProductTypeBadge, StatusBadge, productStatusKey, productTypeKey } from '../../../shared/ui/ledger'
import type { MenuItem } from '../../../shared/ui/ledger'
import type { Product } from '../model/types'

/**
 * Products in the prototype's `SCREENS.products` table. Rows stack into labelled blocks on narrow screens
 * (`table--stack`).
 */
export function ProductsTable({
  products,
  creatorSlug,
  currency,
  busyProductId,
  restoreDisabledReason,
  onArchive,
  onRestore,
}: {
  products: Product[]
  creatorSlug: string
  currency: string
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
            <th scope="col">Type</th>
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
            <th scope="col" className="is-actions">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const detailPath = `/app/${creatorSlug}/products/${product.publicId}`
            const editPath = `${detailPath}/edit`
            const archived = product.status === 'Archived'
            const busy = busyProductId === product.publicId
            const thumb = cover(product.publicId, product.thumbnailUrl)
            const items: MenuItem[] = [
              { label: 'Details', icon: ChartColumn, to: detailPath },
              {
                label: 'Edit',
                icon: Pencil,
                to: editPath,
                disabledReason: archived ? 'Restore the product to edit it.' : undefined,
              },
              'separator',
              archived
                ? { label: 'Restore', icon: ArchiveRestore, onSelect: () => onRestore(product), disabled: busy, disabledReason: restoreDisabledReason }
                : { label: 'Archive', icon: Archive, tone: 'danger', onSelect: () => onArchive(product), disabled: busy },
            ]
            return (
              <tr key={product.publicId} aria-busy={busy || undefined}>
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
                <td data-label="Type">
                  <ProductTypeBadge type={productTypeKey(product.type)} />
                </td>
                <td data-label="Status">
                  <StatusBadge kind="product" value={productStatusKey(product.status)} />
                </td>
                <td data-label="Price" className="is-num">
                  <Money amountCents={product.priceCents} currency={currency} />
                </td>
                <td data-label="Sales" className="is-num">
                  {number(product.paidOrderCount)}
                </td>
                <td data-label="Revenue" className="is-num">
                  <Money amountCents={product.revenueCents} currency={currency} />
                </td>
                <td className="is-actions">
                  <Menu label={`Actions for ${product.name}`} items={items} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
