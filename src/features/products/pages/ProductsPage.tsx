import { Archive, BookOpen, ClipboardList, FileArchive, LayoutGrid, List, Package, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  PlanLimit,
  SkeletonRows,
  Switch,
  useToast,
} from '../../../shared/ui/ledger'
import { number } from '../../../shared/lib/format'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { ProductCard } from '../components/ProductCard'
import { ProductSummary } from '../components/ProductSummary'
import { ProductsTable } from '../components/ProductsTable'
import { sellingPagesOf } from '../model/catalogue'
import { useProductStore } from '../model/product-store'
import type { Product } from '../model/types'

const VIEW_KEY = 'products-view'
type View = 'grid' | 'list'

/** The remembered grid/list choice; the URL wins when it has one. Storage can be unavailable. */
function storedView(): View | null {
  try {
    const value = window.localStorage.getItem(VIEW_KEY)
    return value === 'list' || value === 'grid' ? value : null
  } catch {
    return null
  }
}

/** The products catalogue: an overview, filters, and the products as cards or a table. */
export function ProductsPage() {
  const toast = useToast()
  const { slug = '' } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)

  const products = useProductStore((s) => s.products)
  const loadStatus = useProductStore((s) => s.loadStatus)
  const loadProducts = useProductStore((s) => s.loadProducts)
  const archiveProduct = useProductStore((s) => s.archiveProduct)
  const restoreProduct = useProductStore((s) => s.restoreProduct)
  const resetArchiveFeedback = useProductStore((s) => s.resetArchiveFeedback)
  const resetRestoreFeedback = useProductStore((s) => s.resetRestoreFeedback)
  const pages = useLandingPageStore((s) => s.pages)
  const loadPages = useLandingPageStore((s) => s.loadPages)

  const [busyProductId, setBusyProductId] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null)
  const [query, setQuery] = useState('')

  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  // Fresh numbers on every visit (and for another workspace's address). Archived products are always loaded, so the
  // "Show archived" switch and the counts are client-side.
  useEffect(() => {
    if (!slug) return
    void loadProducts(slug, true)
    void loadPages(slug)
  }, [slug, loadProducts, loadPages])

  const showArchived = searchParams.get('archived') === '1'
  const viewParam = searchParams.get('view')
  const view: View = viewParam === 'list' || viewParam === 'grid' ? viewParam : (storedView() ?? 'grid')

  const updateParams = (changes: Record<string, string | null>) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )

  const chooseView = (next: View) => {
    try {
      window.localStorage.setItem(VIEW_KEY, next)
    } catch {
      // The choice still lives in the URL.
    }
    updateParams({ view: next === 'grid' ? null : next })
  }

  const plan = creatorPlans.find((candidate) => candidate.code === creator?.planCode)
  const maxProducts = plan?.limits['max_products']
  const currency = creator?.defaultCurrency ?? 'EUR'
  const liveCount = products.filter((product) => product.status !== 'Archived').length
  const atLimit = maxProducts !== undefined && maxProducts >= 0 && liveCount >= maxProducts
  const limitReason =
    atLimit && creator
      ? maxProducts === 1
        ? `You’ve used your 1 product on the ${creator.planName} plan. Upgrade to add more.`
        : `You’ve used all ${number(maxProducts)} products on the ${creator.planName} plan. Upgrade to add more.`
      : undefined

  const inScope = useMemo(() => products.filter((product) => showArchived || product.status !== 'Archived'), [products, showArchived])
  const best = inScope
    .filter((product) => product.status === 'Active' && product.revenueCents > 0)
    .sort((a, b) => b.revenueCents - a.revenueCents)[0]
  const ordered = best ? [best, ...inScope.filter((product) => product !== best)] : inScope
  const needle = query.trim().toLowerCase()
  const visible = needle ? ordered.filter((product) => product.name.toLowerCase().includes(needle)) : ordered
  const sellingPages = (product: Product) => sellingPagesOf(product, pages)

  const archive = async (product: Product) => {
    setBusyProductId(product.publicId)
    const ok = await archiveProduct(slug, product.publicId)
    const error = useProductStore.getState().archiveError
    resetArchiveFeedback()
    setBusyProductId(null)
    if (ok) toast({ tone: 'success', title: 'Product archived' })
    else toast({ tone: 'danger', title: error ?? 'Something went wrong. Please try again.' })
  }

  const restore = async (product: Product) => {
    setBusyProductId(product.publicId)
    const ok = await restoreProduct(slug, product.publicId)
    const error = useProductStore.getState().restoreError
    resetRestoreFeedback()
    setBusyProductId(null)
    if (ok) toast({ tone: 'success', title: 'Product restored', message: `${product.name} is back as a draft.` })
    else toast({ tone: 'danger', title: error ?? 'Something went wrong. Please try again.' })
  }

  const newProductButton = (
    <Button variant="primary" icon={Plus} disabledReason={limitReason} to={`/app/${slug}/products/new`}>
      New product
    </Button>
  )

  const header = (
    <PageHeader
      title={<em>Products</em>}
      subtitle="Documents you sell or give away — people download them right away."
      actions={newProductButton}
    />
  )

  const catalogue = () => {
    if (loadStatus === 'error') return <ErrorState onRetry={() => void loadProducts(slug, true)} />
    if (loadStatus !== 'success') return <SkeletonRows />
    if (products.length === 0) {
      return (
        <section className="card">
          <EmptyState
            icon={Package}
            title="No products yet"
            text="Add your first product and upload its file, then sell it — or give it away for an email — from a landing page. People download it right away and get a personal link by email to download it again."
            action={limitReason ? undefined : { label: 'Create product', icon: Plus, variant: 'primary', to: `/app/${slug}/products/new` }}
          />
          <div className="product-kinds">
            {(
              [
                [BookOpen, 'E-books and guides', 'A PDF or EPUB — sell it, or give one away for an email.'],
                [FileArchive, 'Templates and presets', 'Everything in one ZIP, up to 100 MB.'],
                [ClipboardList, 'Workbooks and checklists', 'A PDF people print or fill in.'],
              ] as const
            ).map(([Glyph, title, text]) => (
              <div className="product-kind" key={title}>
                <span className="product-kind__icon">
                  <Glyph />
                </span>
                <strong>{title}</strong>
                <span className="text-sm text-secondary">{text}</span>
              </div>
            ))}
          </div>
        </section>
      )
    }
    return (
      <div className="stack stack--lg reveal">
        {atLimit && creator && maxProducts !== undefined && (
          <PlanLimit noun="products" planName={creator.planName} limit={maxProducts} upgradeTo={`/app/${slug}/settings?tab=billing`} />
        )}
        <ProductSummary products={products} currency={currency} planName={creator?.planName ?? ''} productLimit={maxProducts} />
        <div className="product-toolbar">
          <div className="search product-toolbar__search">
            <Search />
            <input
              className="input"
              type="search"
              placeholder="Search products"
              aria-label="Search products"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Switch
            label="Show archived"
            checked={showArchived}
            onChange={(event) => updateParams({ archived: event.target.checked ? '1' : null })}
          />
          <div className="segmented product-toolbar__view" role="radiogroup" aria-label="View">
            <label className="segmented__option" data-tooltip="Grid">
              <input type="radio" name="product-view" value="grid" aria-label="Grid view" checked={view === 'grid'} onChange={() => chooseView('grid')} />
              <span className="segmented__label">
                <LayoutGrid />
              </span>
            </label>
            <label className="segmented__option" data-tooltip="List">
              <input type="radio" name="product-view" value="list" aria-label="List view" checked={view === 'list'} onChange={() => chooseView('list')} />
              <span className="segmented__label">
                <List />
              </span>
            </label>
          </div>
        </div>
        {visible.length === 0 ? (
          <p className="product-results text-sm text-muted">No products match your search.</p>
        ) : view === 'list' ? (
          <Card flush>
            <ProductsTable
              products={visible}
              creatorSlug={slug}
              currency={currency}
              sellingPagesOf={sellingPages}
              busyProductId={busyProductId}
              restoreDisabledReason={limitReason}
              onArchive={setArchiveTarget}
              onRestore={(product) => void restore(product)}
            />
          </Card>
        ) : (
          <div className="product-grid">
            {visible.map((product) => (
              <ProductCard
                key={product.publicId}
                product={product}
                creatorSlug={slug}
                currency={currency}
                sellingPages={sellingPages(product)}
                featured={product === best}
                busy={busyProductId === product.publicId}
                restoreDisabledReason={limitReason}
                onArchive={setArchiveTarget}
                onRestore={(item) => void restore(item)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <AppShell slug={slug} activeSection="products">
      {creatorLoading ? (
        <SkeletonRows />
      ) : !creator ? (
        <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
      ) : (
        <>
          {header}
          {catalogue()}
          <ConfirmDialog
            open={archiveTarget !== null}
            title={`Archive “${archiveTarget?.name ?? ''}”?`}
            text="It can’t be bought anymore and leaves your product list. Past orders and buyers’ personal links keep working. You can restore it any time."
            confirmLabel="Archive product"
            tone="warning"
            icon={Archive}
            onCancel={() => setArchiveTarget(null)}
            onConfirm={() => {
              const target = archiveTarget
              setArchiveTarget(null)
              if (target) void archive(target)
            }}
          />
        </>
      )}
    </AppShell>
  )
}
