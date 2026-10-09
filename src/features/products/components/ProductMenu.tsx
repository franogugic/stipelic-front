import { Archive, ArchiveRestore, ChartColumn, ExternalLink, Pencil } from 'lucide-react'
import { Menu } from '../../../shared/ui/ledger'
import type { MenuItem } from '../../../shared/ui/ledger'
import type { LandingPage } from '../../landing-pages/model/types'
import type { Product } from '../model/types'

/** The row/card actions of one product: details, edit, its selling page, archive or restore. */
export function ProductMenu({
  product,
  creatorSlug,
  sellingPage,
  busy,
  restoreDisabledReason,
  onArchive,
  onRestore,
}: {
  product: Product
  creatorSlug: string
  /** A published sales page for this product, if there is one. */
  sellingPage: LandingPage | undefined
  busy: boolean
  restoreDisabledReason?: string
  onArchive: (product: Product) => void
  onRestore: (product: Product) => void
}) {
  const detailPath = `/app/${creatorSlug}/products/${product.publicId}`
  const archived = product.status === 'Archived'
  const items: Array<MenuItem | null> = [
    { label: 'Details & analytics', icon: ChartColumn, to: detailPath },
    {
      label: 'Edit',
      icon: Pencil,
      to: `${detailPath}/edit`,
      disabledReason: archived ? 'Restore the product to edit it.' : undefined,
    },
    sellingPage ? { label: 'Open selling page', icon: ExternalLink, href: `/p/${creatorSlug}/${sellingPage.slug}`, external: true } : null,
    'separator',
    archived
      ? { label: 'Restore', icon: ArchiveRestore, onSelect: () => onRestore(product), disabled: busy, disabledReason: restoreDisabledReason }
      : { label: 'Archive', icon: Archive, tone: 'danger', onSelect: () => onArchive(product), disabled: busy },
  ]
  return <Menu label={`Actions for ${product.name}`} items={items} />
}
