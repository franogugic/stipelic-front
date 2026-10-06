import { Download, Landmark, Percent, Receipt, Undo2, Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { number } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Metric,
  Money,
  PageHeader,
  SearchInput,
  Select,
  SkeletonCards,
  SkeletonRows,
  TableFooter,
  useToast,
} from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { listLandingPages } from '../../landing-pages/api/landing-pages-api'
import { listProducts } from '../../products/api/products-api'
import { exportOrders, getOrderSummary, listOrders } from '../api/orders-api'
import type { OrderFilters } from '../api/orders-api'
import { OrdersTable } from '../components/OrdersTable'
import type { Order, OrderStatus, OrderSummary } from '../model/types'

const PAGE_SIZE = 12
const SEARCH_MAX_LENGTH = 100
const SEARCH_DEBOUNCE_MS = 350

const STATUSES: OrderStatus[] = ['Paid', 'Pending', 'Failed', 'Refunded']

type Option = { value: string; label: string }
type Summary = { key: string; summary: OrderSummary | null }
/** The orders loaded so far for one set of filters (first page, then "Load more" pages); `error` when loading failed. */
type Results = { key: string; orders: Order[]; hasMore: boolean; error: boolean }

export function OrdersPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const toast = useToast()
  const creatorCurrency = useCreatorStore((s) => (s.currentCreator?.slug === slug ? s.currentCreator.defaultCurrency : null))

  const [summary, setSummary] = useState<Summary | null>(null)
  const [productOptions, setProductOptions] = useState<Option[]>([])
  const [pageOptions, setPageOptions] = useState<Option[]>([])

  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [productId, setProductId] = useState('')
  const [status, setStatus] = useState('')
  const [pageId, setPageId] = useState('')
  const [attempt, setAttempt] = useState(0)

  const [results, setResults] = useState<Results | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exporting, setExporting] = useState(false)

  const filters: OrderFilters = {
    productId: productId || undefined,
    landingPageId: pageId || undefined,
    status: status || undefined,
    search: term || undefined,
  }
  const filtersActive = Boolean(productId || pageId || status || term)
  const resultsKey = `${slug}|${productId}|${pageId}|${status}|${term}|${attempt}`

  // Workspace-wide numbers and the filter options (archived products and pages still have orders).
  const loadSummary = useCallback(() => {
    getOrderSummary(slug)
      .then((data) => setSummary({ key: slug, summary: data }))
      .catch(() => setSummary({ key: slug, summary: null }))
  }, [slug])

  useEffect(() => {
    if (!slug) return
    loadSummary()
    listProducts(slug, true)
      .then((products) => setProductOptions(products.map((product) => ({ value: product.publicId, label: product.name }))))
      .catch(() => setProductOptions([]))
    listLandingPages(slug, true)
      .then((pages) => setPageOptions(pages.map((page) => ({ value: page.publicId, label: page.title }))))
      .catch(() => setPageOptions([]))
  }, [slug, loadSummary])

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
      productId: productId || undefined,
      landingPageId: pageId || undefined,
      status: status || undefined,
      search: term || undefined,
      limit: PAGE_SIZE,
    })
      .then((page) => current && setResults({ key: resultsKey, orders: page.orders, hasMore: page.hasMore, error: false }))
      .catch(() => current && setResults({ key: resultsKey, orders: [], hasMore: false, error: true }))
    return () => {
      current = false
    }
  }, [slug, productId, pageId, status, term, resultsKey])

  const summaryState = summary?.key === slug ? summary : null
  const first = results?.key === resultsKey ? results : null
  const orders = first?.orders ?? []
  const hasMore = first?.hasMore ?? false
  const currency = summaryState?.summary?.currency ?? creatorCurrency ?? 'EUR'

  const retry = () => {
    setSummary(null)
    loadSummary()
    setResults(null)
    setAttempt((value) => value + 1)
  }

  const loadMore = () => {
    const last = orders[orders.length - 1]
    if (!last || loadingMore) return
    setLoadingMore(true)
    const requestKey = resultsKey
    listOrders(slug, { ...filters, afterCreatedAt: last.createdAt, afterId: last.publicId, limit: PAGE_SIZE })
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

  const clearFilters = () => {
    setSearch('')
    setTerm('')
    setProductId('')
    setStatus('')
    setPageId('')
  }

  const total = summaryState?.summary?.totalOrderCount
  const noOrdersAtAll = total === 0
  const subtitle =
    total === undefined
      ? 'All transactions across your products and pages.'
      : `${number(total)} ${total === 1 ? 'transaction' : 'transactions'} across all products and pages.`

  const count = () => {
    const shown = number(orders.length)
    if (filtersActive || total === undefined) return `Showing ${shown}${hasMore ? '+' : ''}`
    return `Showing ${shown} of ${number(total)}`
  }

  const list = () => {
    if (!first) return <SkeletonRows count={6} />
    if (first.error) return <ErrorState compact onRetry={retry} />
    if (orders.length === 0) {
      return (
        <EmptyState
          compact
          icon={Receipt}
          title="No orders match these filters"
          action={{ label: 'Clear filters', variant: 'ghost', onClick: clearFilters }}
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

  const body = () => {
    if (!summaryState) {
      return (
        <div className="stack stack--lg">
          <SkeletonCards count={4} />
          <SkeletonRows count={6} />
        </div>
      )
    }
    const data = summaryState.summary
    if (!data) return <ErrorState onRetry={retry} />
    if (noOrdersAtAll) {
      return (
        <EmptyState
          icon={Receipt}
          title="No orders yet"
          text="Orders appear here as soon as someone buys from one of your pages."
        />
      )
    }
    return (
      <>
        <div className="grid grid--4 reveal" style={{ marginBottom: 'var(--space-6)' }}>
          <Metric label="Gross revenue" icon={Wallet} value={<Money amountCents={data.totalPaidAmountCents} currency={currency} />} />
          <Metric label="Platform fees" icon={Percent} value={<Money amountCents={data.totalPlatformFeeCents} currency={currency} />} />
          <Metric label="Net to you" icon={Landmark} value={<Money amountCents={data.netAmountCents} currency={currency} />} />
          <Metric label="Refunded" icon={Undo2} value={number(data.refundedOrderCount)} meta="orders" />
        </div>
        <Card>
          <div className="toolbar">
            <SearchInput
              placeholder="Search customer or email"
              aria-label="Search customer or email"
              maxLength={SEARCH_MAX_LENGTH}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select aria-label="Product" value={productId} onChange={(event) => setProductId(event.target.value)}>
              <option value="">All products</option>
              {productOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
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
          </div>
          {list()}
        </Card>
      </>
    )
  }

  return (
    <AppShell slug={slug} activeSection="orders">
      <PageHeader
        title={<em>Orders</em>}
        subtitle={subtitle}
        actions={
          <Button
            variant="secondary"
            icon={Download}
            loading={exporting}
            disabledReason={noOrdersAtAll ? 'There are no orders to export yet.' : undefined}
            onClick={() => void runExport()}
          >
            Export CSV
          </Button>
        }
      />
      {body()}
    </AppShell>
  )
}
