import { Archive, Package, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { number } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PageHeader,
  SkeletonRows,
  Switch,
  useToast,
} from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { ProductsTable } from '../components/ProductsTable'
import { useProductStore } from '../model/product-store'
import type { Product } from '../model/types'

export function ProductsPage() {
  const toast = useToast()
  const { slug = '' } = useParams<{ slug: string }>()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)

  const products = useProductStore((s) => s.products)
  const loadStatus = useProductStore((s) => s.loadStatus)
  const includeArchived = useProductStore((s) => s.includeArchived)
  const loadProducts = useProductStore((s) => s.loadProducts)
  const setIncludeArchived = useProductStore((s) => s.setIncludeArchived)
  const archiveProduct = useProductStore((s) => s.archiveProduct)
  const restoreProduct = useProductStore((s) => s.restoreProduct)
  const resetArchiveFeedback = useProductStore((s) => s.resetArchiveFeedback)
  const resetRestoreFeedback = useProductStore((s) => s.resetRestoreFeedback)

  const [busyProductId, setBusyProductId] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null)

  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  // Fresh numbers on every visit (and for another workspace's address).
  useEffect(() => {
    if (slug) void loadProducts(slug, useProductStore.getState().includeArchived)
  }, [slug, loadProducts])

  const plan = creatorPlans.find((candidate) => candidate.code === creator?.planCode)
  const maxProducts = plan?.limits['max_products']
  const activeProductCount = products.filter((product) => product.status !== 'Archived').length
  // With "Show archived", archived products come after the live ones (stable, so the API's order is kept within each).
  const sortedProducts = [...products].sort((a, b) => Number(a.status === 'Archived') - Number(b.status === 'Archived'))
  const atLimit = maxProducts !== undefined && maxProducts >= 0 && activeProductCount >= maxProducts
  const limitReason =
    atLimit && creator
      ? maxProducts === 1
        ? `You’ve used your 1 product on the ${creator.planName} plan.`
        : `You’ve used all ${number(maxProducts)} products on the ${creator.planName} plan.`
      : undefined

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
    if (ok) toast({ tone: 'success', title: 'Product restored' })
    else toast({ tone: 'danger', title: error ?? 'Something went wrong. Please try again.' })
  }

  const newProductButton = (
    <Button variant="primary" icon={Plus} disabledReason={limitReason} to={`/app/${slug}/products/new`}>
      New product
    </Button>
  )

  const content = () => {
    if (loadStatus === 'error') return <ErrorState onRetry={() => void loadProducts(slug, includeArchived)} />
    if (loadStatus !== 'success') return <SkeletonRows />
    if (products.length === 0) {
      return (
        <EmptyState
          icon={Package}
          title="No products yet"
          text="Create your first product — a download, a course or a service — and sell it from a landing page."
          action={limitReason ? undefined : { label: 'Create product', icon: Plus, variant: 'primary', to: `/app/${slug}/products/new` }}
        />
      )
    }
    return (
      <ProductsTable
        products={sortedProducts}
        creatorSlug={slug}
        currency={creator?.defaultCurrency ?? 'EUR'}
        busyProductId={busyProductId}
        restoreDisabledReason={limitReason}
        onArchive={setArchiveTarget}
        onRestore={(product) => void restore(product)}
      />
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
          <PageHeader
            title={<em>Products</em>}
            subtitle="Everything you sell — delivered to buyers as a link by email."
            actions={
              <>
                <Switch
                  label="Show archived"
                  checked={includeArchived}
                  onChange={(event) => setIncludeArchived(slug, event.target.checked)}
                />
                {newProductButton}
              </>
            }
          />
          <Card title="All products" flush>
            {content()}
          </Card>

          <ConfirmDialog
            open={archiveTarget !== null}
            title={`Archive “${archiveTarget?.name ?? ''}”?`}
            text="It will no longer be available for sale. You can restore it from “Show archived” at any time."
            confirmLabel="Archive product"
            tone="danger"
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
