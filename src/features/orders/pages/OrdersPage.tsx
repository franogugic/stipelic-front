import { Download, Receipt } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { number, plural } from '../../../shared/lib/format'
import { useKeyedLoad } from '../../../shared/lib/use-keyed-load'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  SkeletonCards,
  SkeletonRows,
  TableFilterBar,
  TableFooter,
  useToast,
} from '../../../shared/ui/ledger'
import { PageControls } from '../../analytics/components/PageControls'
import { QuietPeriod } from '../../analytics/components/QuietPeriod'
import { usePagePeriod } from '../../analytics/model/use-page-period'
import { useCreatorStore } from '../../creators/model/creator-store'
import { listLandingPages } from '../../landing-pages/api/landing-pages-api'
import { listProducts } from '../../products/api/products-api'
import { exportOrders, getOrderPeriodSummary, listOrders } from '../api/orders-api'
import type { OrderFilters } from '../api/orders-api'
import { OrdersBoard } from '../components/OrdersBoard'
import { OrdersTable } from '../components/OrdersTable'
import type { Order, OrderStatus, OrdersPage as OrdersPageData } from '../model/types'

const PAGE_SIZE = 12
const SEARCH_MAX_LENGTH = 100
const SEARCH_DEBOUNCE_MS = 350

const STATUS_FILTERS: Array<[string, string]> = [
  ['all', 'All'],
  ['paid', 'Paid'],
  ['pending', 'Pending'],
  ['failed', 'Failed'],
  ['refunded', 'Refunded'],
]
const STATUS_OF: Record<string, OrderStatus> = { paid: 'Paid', pending: 'Pending', failed: 'Failed', refunded: 'Refunded' }

type Option = { value: string; label: string }
/** The orders loaded so far for one set of filters (first page, then "Load more" pages); `error` when loading failed. */
type Results = {
  key: string
  orders: Order[]
  hasMore: boolean
  total: number | null
  statusCounts: OrdersPageData['statusCounts']
  error: boolean
}

export function OrdersPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const toast = useToast()
  const creatorCurrency = useCreatorStore((s) => (s.currentCreator?.slug === slug ? s.currentCreator.defaultCurrency : null))
  // The period, the product and the status live in the URL, so a view can be linked to.
  const { period, setPeriod, params, update } = usePagePeriod('orders')
  const statusParam = params.get('status') ?? ''
  const statusKey = STATUS_FILTERS.some(([key]) => key === statusParam) && statusParam !== 'all' ? statusParam : 'all'
  const status = statusKey === 'all' ? '' : STATUS_OF[statusKey]
  const productId = params.get('product') ?? ''

  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [pageId, setPageId] = useState('')
  const [attempt, setAttempt] = useState(0)

  const [results, setResults] = useState<Results | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exporting, setExporting] = useState(false)

  const ready = slug !== ''
  const summary = useKeyedLoad(ready ? `${slug}|${period.id}|${productId}` : null, () =>
    getOrderPeriodSummary(slug, period.id, productId || null),
  )
  // Products an order can belong to: those that sell, active ones and archived ones that still have orders.
  const products = useKeyedLoad(ready ? `products|${slug}` : null, () => listProducts(slug, true))
  const pages = useKeyedLoad(ready ? `pages|${slug}` : null, () => listLandingPages(slug, true))

  const productOptions: Option[] =
    products.load.status === 'success'
      ? products.load.data
          .filter((product) => product.priceCents > 0 && (product.status === 'Active' || (product.status === 'Archived' && (product.orderCount ?? 1) > 0)))
          .map((product) => ({ value: product.publicId, label: product.name }))
      : []
  // A product in the link that is not in the list (a draft, say) still shows as the chosen one.
  const chosenProduct = products.load.status === 'success' ? products.load.data.find((product) => product.publicId === productId) : undefined
  if (productId && chosenProduct && !productOptions.some((option) => option.value === productId)) {
    productOptions.push({ value: productId, label: chosenProduct.name })
  }
  const pageOptions: Option[] =
    pages.load.status === 'success' ? pages.load.data.map((page) => ({ value: page.publicId, label: page.title })) : []

  const filters: OrderFilters = {
    period: period.id,
    productId: productId || undefined,
    landingPageId: pageId || undefined,
    status: status || undefined,
    search: term || undefined,
  }
  const filtersActive = Boolean(productId || pageId || status || term)
  const resultsKey = `${slug}|${period.id}|${productId}|${pageId}|${status}|${term}|${attempt}`

  // The search runs 350 ms after the last keystroke, trimmed.
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  // A new set of filters starts from the first page again; a result for older filters is never shown.
  useEffect(() => {
    if (!slug) return
    let current = true
    listOrders(slug, {
      period: period.id,
      productId: productId || undefined,
      landingPageId: pageId || undefined,
      status: status || undefined,
      search: term || undefined,
      limit: PAGE_SIZE,
    })
      .then(
        (page) =>
          current &&
          setResults({ key: resultsKey, orders: page.orders, hasMore: page.hasMore, total: page.total, statusCounts: page.statusCounts, error: false }),
      )
      .catch(() => current && setResults({ key: resultsKey, orders: [], hasMore: false, total: null, statusCounts: null, error: true }))
    return () => {
      current = false
    }
  }, [slug, period.id, productId, pageId, status, term, resultsKey])

  const first = results?.key === resultsKey ? results : null
  const orders = first?.orders ?? []
  const hasMore = first?.hasMore ?? false
  const summaryData = summary.load.status === 'success' ? summary.load.data : null
  const currency = summaryData?.currency ?? creatorCurrency ?? 'EUR'
  const lower = period.label.toLowerCase()

  const retry = () => {
    summary.reload()
    setResults(null)
    setAttempt((value) => value + 1)
  }

  const loadMore = () => {
    const last = orders[orders.length - 1]
    if (!last || loadingMore) return
    setLoadingMore(true)
    const requestKey = resultsKey
    listOrders(slug, { ...filters, afterCountedAt: last.countedAt, afterId: last.publicId, limit: PAGE_SIZE })
      // Appended only while the filters are still the ones it was asked for.
      .then((page) =>
        setResults((current) =>
          current?.key === requestKey
            ? { ...current, orders: [...current.orders, ...page.orders], hasMore: page.hasMore }
            : current,
        ),
      )
      .catch(() => toast({ tone: 'danger', title: 'We couldn’t load more orders. Please try again.' }))
      .finally(() => setLoadingMore(false))
  }

  const runExport = async () => {
    setExporting(true)
    try {
      await exportOrders(slug, filters)
    } catch (error) {
      toast({
        tone: 'danger',
        title: error instanceof Error ? error.message : 'We couldn’t export the orders. Please try again.',
      })
    } finally {
      setExporting(false)
    }
  }

  const setStatusFilter = (key: string) => update({ status: key === 'all' ? null : key })
  const setProductFilter = (id: string) => update({ product: id || null })

  const clearFilters = () => {
    setSearch('')
    setTerm('')
    setPageId('')
    update({ product: null, status: null })
  }

  const shown = first?.total ?? null
  const exportNote = shown === null ? 'Exports the orders shown' : `Exports the ${plural(shown, 'order')} shown`
  const noOrdersEver = period.id === 'all' && !productId && summaryData?.totalOrderCount === 0

  const count = () => {
    const loaded = number(orders.length)
    if (shown === null) return `Showing ${loaded}${hasMore ? '+' : ''}`
    return `Showing ${loaded} of ${number(shown)}`
  }

  const list = () => {
    if (!first) return <SkeletonRows count={6} />
    if (first.error) return <ErrorState compact onRetry={retry} />
    if (orders.length === 0) {
      return filtersActive || term ? (
        <EmptyState
          compact
          icon={Receipt}
          title="No orders match these filters"
          action={{ label: 'Clear filters', variant: 'ghost', onClick: clearFilters }}
        />
      ) : (
        <QuietPeriod
          period={period.id}
          icon={Receipt}
          title="No orders in this period"
          text={`Nothing was ordered ${period.id === 'today' ? 'today' : `in the ${lower}`}.`}
          onShowAll={() => setPeriod('all')}
        />
      )
    }
    return (
      <>
        <OrdersTable orders={orders} />
        <TableFooter count={count()} onLoadMore={hasMore ? loadMore : undefined} loading={loadingMore} />
      </>
    )
  }

  const statusCount = (key: string) => {
    const counts = first?.statusCounts
    if (counts) return counts[key as keyof typeof counts]
    if (!summaryData) return 0
    if (key === 'all') return summaryData.totalOrderCount
    if (key === 'paid') return summaryData.paidOrderCount
    if (key === 'pending') return summaryData.pendingOrderCount
    if (key === 'failed') return summaryData.failedOrderCount
    return summaryData.refundedOrderCount
  }

  const productName = productId ? (chosenProduct?.name ?? null) : null

  const body = () => {
    if (noOrdersEver) {
      return (
        <EmptyState
          icon={Receipt}
          title="No orders yet"
          text="Orders appear here as soon as someone buys from one of your pages."
        />
      )
    }
    return (
      <div className="stack stack--lg reveal">
        {summary.load.status === 'error' ? (
          <ErrorState compact onRetry={retry} />
        ) : summaryData ? (
          <OrdersBoard summary={summaryData} currency={currency} />
        ) : (
          <SkeletonCards count={4} />
        )}
        <section className="card" aria-labelledby="order-list-title">
          <div className="card__header">
            <div className="card__heading">
              <h2 className="card__title" id="order-list-title">
                {period.id === 'all' ? 'All orders' : `Orders · ${lower}`}
              </h2>
              <p className="card__subtitle">
                {plural(first?.statusCounts?.all ?? summaryData?.totalOrderCount ?? 0, 'order')}
                {productName ? ` for ${productName}` : ''} · newest first
              </p>
            </div>
          </div>
          <TableFilterBar
            noun="customer or email"
            statuses={STATUS_FILTERS}
            status={statusKey}
            count={statusCount}
            onStatus={setStatusFilter}
            query={search}
            onQuery={setSearch}
            maxLength={SEARCH_MAX_LENGTH}
            extra={
              <>
                <Select aria-label="Product" value={productId} onChange={(event) => setProductFilter(event.target.value)}>
                  <option value="">All products</option>
                  {productOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Select aria-label="Landing page" value={pageId} onChange={(event) => setPageId(event.target.value)}>
                  <option value="">All pages</option>
                  {pageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </>
            }
          />
          {list()}
        </section>
      </div>
    )
  }

  return (
    <AppShell slug={slug} activeSection="orders">
      <PageHeader
        title={<em>Orders</em>}
        subtitle="Every transaction across your products and pages."
        actions={
          <Button
            variant="secondary"
            icon={Download}
            loading={exporting}
            data-tooltip={exportNote}
            disabledReason={noOrdersEver || shown === 0 ? 'There are no orders to export.' : undefined}
            onClick={() => void runExport()}
          >
            Export CSV
          </Button>
        }
      />
      <div className="stack stack--lg">
        <PageControls
          period={period.id}
          onPeriod={setPeriod}
          series={
            summaryData
              ? { period: summaryData.period, timezone: summaryData.timezone, since: summaryData.range.from, range: summaryData.range, previousRange: summaryData.previousRange }
              : null
          }
          loading={summary.load.status === 'loading'}
          updatedAt={summary.load.status === 'success' ? summary.load.at : new Date()}
          sinceNote="your first order"
        />
        {body()}
      </div>
    </AppShell>
  )
}
