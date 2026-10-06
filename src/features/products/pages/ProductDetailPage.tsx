import { Calendar, PanelsTopLeft, Pencil, ShoppingBag, Users, Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { date, dateShort, money, month, monthYear, number } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Bars,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Metric,
  Money,
  PageHeader,
  ProductTypeBadge,
  Segmented,
  SkeletonBlock,
  SkeletonCards,
  SkeletonRows,
  StatusBadge,
  pageStatusKey,
  productStatusKey,
  productTypeKey,
} from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { listOrders } from '../../orders/api/orders-api'
import { OrdersTable } from '../../orders/components/OrdersTable'
import type { Order } from '../../orders/model/types'
import { getProductAnalytics, listProducts } from '../api/products-api'
import type { Product, ProductAnalytics, ProductAnalyticsRange } from '../model/types'

type Load<T> = { status: 'loading' } | { status: 'error'; notFound: boolean } | { status: 'success'; data: T }

const LATEST_ORDERS_SHOWN = 4
const MAX_AXIS_LABELS = 12

const RANGES: Array<{ value: ProductAnalyticsRange; label: string }> = [
  { value: '30d', label: '30d' },
  { value: '3m', label: '3m' },
  { value: '6m', label: '6m' },
  { value: '1y', label: '1y' },
]

const LOADING = { status: 'loading' } as const

function failed(error: unknown): Load<never> {
  return { status: 'error', notFound: error instanceof ApiError && error.status === 404 }
}

/** Axis labels follow the bucket size (days → "3 Sep", months → "Sep"); the tooltips name the bucket in full. */
function bucketLabels(points: ProductAnalytics['points'], granularity: ProductAnalytics['granularity']) {
  const step = Math.max(1, Math.ceil(points.length / MAX_AXIS_LABELS))
  return {
    axis: points.map((point, index) =>
      index % step === 0 ? (granularity === 'month' ? month(point.bucketStart) : dateShort(point.bucketStart)) : '',
    ),
    tooltips: points.map((point) => (granularity === 'month' ? monthYear(point.bucketStart) : date(point.bucketStart))),
  }
}

/** The prototype's `SCREENS['product-detail']`. */
export function ProductDetailPage() {
  const { slug = '', productId = '' } = useParams<{ slug: string; productId: string }>()
  const productKey = `${slug}/${productId}`
  const creatorCurrency = useCreatorStore((s) => (s.currentCreator?.slug === slug ? s.currentCreator.defaultCurrency : null))

  // Results are tagged with the product they were loaded for, so a late response never shows on another product.
  const [product, setProduct] = useState<{ key: string; load: Load<Product> } | null>(null)
  const [orders, setOrders] = useState<{ key: string; load: Load<Order[]> } | null>(null)
  const [analytics, setAnalytics] = useState<Record<string, Load<ProductAnalytics>>>({})
  const [range, setRange] = useState<ProductAnalyticsRange>('1y')

  const loadProduct = useCallback(() => {
    // The store's list may leave archived products out, so the product comes straight from the API.
    listProducts(slug, true)
      .then((products) => {
        const found = products.find((candidate) => candidate.publicId === productId)
        setProduct({ key: productKey, load: found ? { status: 'success', data: found } : { status: 'error', notFound: true } })
      })
      .catch((error: unknown) => setProduct({ key: productKey, load: failed(error) }))
  }, [slug, productId, productKey])

  const loadOrders = useCallback(() => {
    listOrders(slug, { productId, limit: LATEST_ORDERS_SHOWN })
      .then((page) => setOrders({ key: productKey, load: { status: 'success', data: page.orders } }))
      .catch((error: unknown) => setOrders({ key: productKey, load: failed(error) }))
  }, [slug, productId, productKey])

  const loadAnalytics = useCallback(
    (selected: ProductAnalyticsRange) => {
      const key = `${productKey}|${selected}`
      getProductAnalytics(slug, productId, selected)
        .then((data) => setAnalytics((current) => ({ ...current, [key]: { status: 'success', data } })))
        .catch((error: unknown) => setAnalytics((current) => ({ ...current, [key]: failed(error) })))
    },
    [slug, productId, productKey],
  )

  useEffect(() => {
    if (!slug || !productId) return
    loadProduct()
    loadOrders()
  }, [slug, productId, loadProduct, loadOrders])

  // Switching the range refetches the numbers and the chart; a range already loaded for this product is reused.
  const analyticsKey = `${productKey}|${range}`
  const hasAnalytics = analyticsKey in analytics
  useEffect(() => {
    if (slug && productId && !hasAnalytics) loadAnalytics(range)
  }, [slug, productId, range, hasAnalytics, loadAnalytics])

  const productLoad: Load<Product> = product?.key === productKey ? product.load : LOADING
  const ordersLoad: Load<Order[]> = orders?.key === productKey ? orders.load : LOADING
  const analyticsLoad: Load<ProductAnalytics> = analytics[analyticsKey] ?? LOADING
  // The four numbers don't depend on the range: they come from the first range loaded for this product, so
  // switching the range only puts the chart back to a skeleton.
  const headline = Object.entries(analytics).find(
    (entry): entry is [string, { status: 'success'; data: ProductAnalytics }] =>
      entry[0].startsWith(`${productKey}|`) && entry[1].status === 'success',
  )?.[1].data

  const retryAll = () => {
    setProduct({ key: productKey, load: LOADING })
    setAnalytics((current) => ({ ...current, [analyticsKey]: LOADING }))
    loadProduct()
    loadAnalytics(range)
  }

  const listUrl = `/app/${slug}/products`

  const body = () => {
    const notFound =
      (productLoad.status === 'error' && productLoad.notFound) ||
      (analyticsLoad.status === 'error' && analyticsLoad.notFound)
    if (notFound) {
      return (
        <ErrorState
          title="Product not found"
          text="This product doesn’t exist or isn’t part of your workspace."
          action={{ label: 'Back to products', to: listUrl }}
        />
      )
    }
    if (productLoad.status === 'error' || (!headline && analyticsLoad.status === 'error')) return <ErrorState onRetry={retryAll} />
    if (productLoad.status === 'loading' || !headline) {
      return (
        <div className="stack stack--lg">
          <SkeletonCards count={4} />
          <SkeletonBlock />
        </div>
      )
    }

    const item = productLoad.data
    const stats = headline
    const currency = creatorCurrency ?? 'EUR'

    return (
      <>
        <PageHeader
          eyebrow="Product"
          title={item.name}
          subtitle={item.description}
          actions={
            <>
              <ProductTypeBadge type={productTypeKey(item.type)} />
              <StatusBadge kind="product" value={productStatusKey(item.status)} />
              <Button
                variant="primary"
                icon={Pencil}
                to={`${listUrl}/${productId}/edit`}
                disabledReason={item.status === 'Archived' ? 'Restore the product to edit it.' : undefined}
              >
                Edit
              </Button>
            </>
          }
        />
        <div className="stack stack--lg reveal">
          <div className="grid grid--4">
            <Metric label="Revenue" icon={Wallet} value={<Money amountCents={stats.revenueCents} currency={currency} />} meta="all time" />
            <Metric
              label="Sales"
              icon={ShoppingBag}
              value={number(stats.salesCount)}
              meta={`${money(item.priceCents, currency)} each`}
            />
            <Metric label="This month" icon={Calendar} value={<Money amountCents={stats.thisMonthRevenueCents} currency={currency} />} />
            <Metric label="Contacts" icon={Users} value={number(stats.contactCount)} meta="from this product" />
          </div>

          <Card
            title="Revenue over time"
            action={
              <Segmented
                label="Range"
                options={RANGES}
                value={range}
                onChange={(value) => setRange(value as ProductAnalyticsRange)}
              />
            }
          >
            {analyticsLoad.status === 'success' ? (
              <RevenueBars
                stats={analyticsLoad.data}
                formatValue={(cents) => money(cents, currency, { decimals: false })}
                label={`Revenue, ${range}`}
              />
            ) : analyticsLoad.status === 'error' ? (
              <ErrorState
                compact
                onRetry={() => {
                  setAnalytics((current) => ({ ...current, [analyticsKey]: LOADING }))
                  loadAnalytics(range)
                }}
              />
            ) : (
              <SkeletonBlock />
            )}
          </Card>

          <div className="grid grid--2">
            <Card title="Selling pages">
              {stats.sellingPages.length > 0 ? (
                <div className="list">
                  {stats.sellingPages.map((page) => (
                    <div className="list__row" key={page.publicId}>
                      <PanelsTopLeft />
                      <Link className="list__grow table__primary" to={`/app/${slug}/landing-pages/${page.publicId}`}>
                        {page.title}
                      </Link>
                      <StatusBadge kind="page" value={pageStatusKey(page.status)} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  No landing pages sell this product yet.{' '}
                  <Link className="link" to={`/app/${slug}/landing-pages`}>
                    Create a landing page
                  </Link>
                </p>
              )}
            </Card>
            <Card title="Latest orders" flush>
              {ordersLoad.status === 'success' ? (
                ordersLoad.data.length > 0 ? (
                  <OrdersTable orders={ordersLoad.data} compact />
                ) : (
                  <EmptyState compact icon={ShoppingBag} title="No orders yet" text="Sales of this product will show up here." />
                )
              ) : ordersLoad.status === 'error' ? (
                <ErrorState compact onRetry={() => {
                  setOrders({ key: productKey, load: LOADING })
                  loadOrders()
                }} />
              ) : (
                <SkeletonRows count={4} />
              )}
            </Card>
          </div>
        </div>
      </>
    )
  }

  return (
    <AppShell slug={slug} activeSection="products" documentTitle="Product · Luma">
      {body()}
    </AppShell>
  )
}

function RevenueBars({
  stats,
  formatValue,
  label,
}: {
  stats: ProductAnalytics
  formatValue: (cents: number) => string
  label: string
}) {
  const { axis, tooltips } = bucketLabels(stats.points, stats.granularity)
  return (
    <Bars
      values={stats.points.map((point) => point.revenueCents)}
      labels={axis}
      tooltipLabels={tooltips}
      formatValue={formatValue}
      label={label}
    />
  )
}
