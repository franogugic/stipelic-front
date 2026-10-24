import { ArrowLeft, ArrowRight, ChartNoAxesCombined, MailPlus, PackageOpen, PanelsTopLeft, Pencil, Receipt } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { date, money, number, percent, plural } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Money,
  FileTypeBadge,
  FreeBadge,
  PageHeader,
  SkeletonBlock,
  SkeletonRows,
  StatusBadge,
  orderBadgeKey,
  pageStatusKey,
  productStatusKey,
  subscriberStatusKey,
} from '../../../shared/ui/ledger'
import { getAnalyticsSeries } from '../../analytics/api/series-api'
import { AnalyticsBoard } from '../../analytics/components/AnalyticsBoard'
import { PageControls } from '../../analytics/components/PageControls'
import { PersonRow } from '../../analytics/components/PersonRow'
import { metricById } from '../../analytics/model/series'
import type { AnalyticsMetric, AnalyticsPeriod, AnalyticsSeries } from '../../analytics/model/types'
import { usePagePeriod } from '../../analytics/model/use-page-period'
import { useCreatorStore } from '../../creators/model/creator-store'
import { listLandingPages } from '../../landing-pages/api/landing-pages-api'
import type { LandingPage } from '../../landing-pages/model/types'
import { listOrders } from '../../orders/api/orders-api'
import type { Order } from '../../orders/model/types'
import { getProductSignups, listProducts } from '../api/products-api'
import { FileGlyph } from '../components/FileGlyph'
import { fileFormatOf, fileMeta, isFreeProduct } from '../model/product-file'
import type { Product, ProductSignups } from '../model/types'

type Load<T> = { status: 'loading' } | { status: 'error'; notFound: boolean } | { status: 'success'; data: T }
type Keyed<T> = { key: string; load: Load<T> }
type Loaded = { series: AnalyticsSeries; at: Date }

const LATEST_ROWS = 5
// Revenue is the useful default for a product that sells.
const DEFAULT_METRIC: AnalyticsMetric = 'revenue'
// A free product is given away for an email: its numbers are sign-ups, not sales.
const FREE_DEFAULT_METRIC: AnalyticsMetric = 'emails'
const LOADING = { status: 'loading' } as const

function failed(error: unknown): Load<never> {
  return { status: 'error', notFound: error instanceof ApiError && error.status === 404 }
}

/** The prototype's `SCREENS['product-detail']`. */
export function ProductDetailPage() {
  const { slug = '', productId = '' } = useParams<{ slug: string; productId: string }>()
  const productKey = `${slug}/${productId}`
  const creatorCurrency = useCreatorStore((s) => (s.currentCreator?.slug === slug ? s.currentCreator.defaultCurrency : null))
  const { period, setPeriod, params, update } = usePagePeriod('product-detail')
  const [productFree, setProductFree] = useState(false)
  const defaultMetric = productFree ? FREE_DEFAULT_METRIC : DEFAULT_METRIC
  const metric = metricById(params.get('metric'), defaultMetric).id

  // Results are tagged with the product they were loaded for, so a late response never shows on another product.
  const [product, setProduct] = useState<Keyed<Product> | null>(null)
  const [orders, setOrders] = useState<Keyed<Order[]> | null>(null)
  const [lastSale, setLastSale] = useState<Keyed<string | null> | null>(null)
  const [pages, setPages] = useState<Keyed<LandingPage[]> | null>(null)
  const [signups, setSignups] = useState<Keyed<ProductSignups> | null>(null)
  const [series, setSeries] = useState<Record<string, Load<Loaded>>>({})

  const loadProduct = useCallback(() => {
    // The store's list may leave archived products out, so the product comes straight from the API.
    listProducts(slug, true)
      .then((products) => {
        const found = products.find((candidate) => candidate.publicId === productId)
        setProduct({ key: productKey, load: found ? { status: 'success', data: found } : { status: 'error', notFound: true } })
        setProductFree(found ? isFreeProduct(found) : false)
      })
      .catch((error: unknown) => setProduct({ key: productKey, load: failed(error) }))
  }, [slug, productId, productKey])

  const loadLists = useCallback(() => {
    listOrders(slug, { productId, limit: LATEST_ROWS })
      .then((page) => setOrders({ key: productKey, load: { status: 'success', data: page.orders } }))
      .catch((error: unknown) => setOrders({ key: productKey, load: failed(error) }))
    listOrders(slug, { productId, status: 'Paid', limit: 1 })
      .then((page) =>
        setLastSale({ key: productKey, load: { status: 'success', data: page.orders[0]?.paidAt ?? page.orders[0]?.createdAt ?? null } }),
      )
      .catch((error: unknown) => setLastSale({ key: productKey, load: failed(error) }))
    listLandingPages(slug)
      .then((all) =>
        setPages({
          key: productKey,
          load: { status: 'success', data: all.filter((page) => page.productPublicId === productId && page.status !== 'Archived') },
        }),
      )
      .catch((error: unknown) => setPages({ key: productKey, load: failed(error) }))
  }, [slug, productId, productKey])

  // A free product's latest sign-ups: the newest across the lead pages that give it away (one row per email).
  const loadSignups = useCallback(() => {
    getProductSignups(slug, productId, LATEST_ROWS)
      .then((data) => setSignups({ key: productKey, load: { status: 'success', data } }))
      .catch((error: unknown) => setSignups({ key: productKey, load: failed(error) }))
  }, [slug, productId, productKey])
  useEffect(() => {
    if (productFree) loadSignups()
  }, [productFree, loadSignups])

  const loadSeries = useCallback(
    (id: AnalyticsPeriod) => {
      const key = `${productKey}|${id}`
      getAnalyticsSeries(slug, 'product', productId, id)
        .then((data) => setSeries((current) => ({ ...current, [key]: { status: 'success', data: { series: data, at: new Date() } } })))
        .catch((error: unknown) => setSeries((current) => ({ ...current, [key]: failed(error) })))
    },
    [slug, productId, productKey],
  )

  useEffect(() => {
    if (!slug || !productId) return
    loadProduct()
    loadLists()
  }, [slug, productId, loadProduct, loadLists])

  // Each period is fetched once per product; going back to one already loaded reuses it.
  const seriesKey = `${productKey}|${period.id}`
  const hasSeries = seriesKey in series
  useEffect(() => {
    if (slug && productId && !hasSeries) loadSeries(period.id)
  }, [slug, productId, period.id, hasSeries, loadSeries])

  const chooseMetric = (next: AnalyticsMetric) => update({ metric: next === defaultMetric ? null : next })

  const retry = <T,>(setter: (value: Keyed<T>) => void, load: () => void) => () => {
    setter({ key: productKey, load: LOADING })
    load()
  }
  const retrySeries = () => {
    setSeries((current) => ({ ...current, [seriesKey]: LOADING }))
    loadSeries(period.id)
  }

  const productLoad: Load<Product> = product?.key === productKey ? product.load : LOADING
  const ordersLoad: Load<Order[]> = orders?.key === productKey ? orders.load : LOADING
  const lastSaleLoad: Load<string | null> = lastSale?.key === productKey ? lastSale.load : LOADING
  const pagesLoad: Load<LandingPage[]> = pages?.key === productKey ? pages.load : LOADING
  const seriesLoad: Load<Loaded> = series[seriesKey] ?? LOADING
  const signupsLoad: Load<ProductSignups> = signups?.key === productKey ? signups.load : LOADING

  const listUrl = `/app/${slug}/products`

  const body = () => {
    if (productLoad.status === 'loading') {
      return (
        <div className="stack stack--lg">
          <SkeletonBlock />
          <SkeletonRows count={4} />
        </div>
      )
    }
    if (productLoad.status === 'error') {
      return productLoad.notFound ? (
        <ErrorState
          title="Product not found"
          text="This product doesn’t exist or isn’t part of your workspace."
          action={{ label: 'Back to products', icon: ArrowLeft, to: listUrl }}
        />
      ) : (
        <ErrorState onRetry={retry(setProduct, loadProduct)} />
      )
    }

    const item = productLoad.data
    const currency = creatorCurrency ?? 'EUR'
    const draft = item.status === 'Draft'
    const sold = item.paidOrderCount > 0
    const free = isFreeProduct(item)
    const format = item.fileName ? fileFormatOf(item.fileName) : null
    const leadPages = pagesLoad.status === 'success' ? pagesLoad.data.filter((page) => page.type === 'LeadGen') : []

    const boardNode =
      seriesLoad.status === 'success' && free ? (
        <AnalyticsBoard
          series={seriesLoad.data.series}
          metric={metric}
          order={['emails', 'downloads', 'views']}
          name="Sign-ups for this document"
          empty={
            (item.signupCount ?? seriesLoad.data.series.totals.emails) > 0
              ? undefined
              : {
                  icon: MailPlus,
                  title: 'No sign-ups yet',
                  text: 'Share the lead page that gives it away — sign-ups and views show up here.',
                  action: { label: 'Open landing pages', icon: PanelsTopLeft, to: `/app/${slug}/landing-pages` },
                }
          }
          stats={(totals) => {
            const extras = seriesLoad.data.series.extras
            return [
              ['Visitors who signed up', percent(totals.views ? (totals.emails / totals.views) * 100 : 0)],
              ['Downloads per sign-up', totals.emails ? (totals.downloads / totals.emails).toFixed(1) : '—'],
              ['Still subscribed', extras && extras.signups > 0 ? percent((extras.signupsStillSubscribed / extras.signups) * 100) : '—'],
              ['Lead pages', number(leadPages.length)],
            ]
          }}
          onMetric={chooseMetric}
        />
      ) : seriesLoad.status === 'success' ? (
        <AnalyticsBoard
          series={seriesLoad.data.series}
          metric={metric}
          order={['revenue', 'sales', 'views', 'emails']}
          name="Product performance"
          empty={
            sold
              ? undefined
              : draft
                ? {
                    icon: PackageOpen,
                    title: 'Not on sale yet',
                    text: 'Finish setting it up and add it to a landing page — sales and views show up here.',
                    action: { label: 'Continue setup', icon: ArrowRight, to: `${listUrl}/${productId}/edit` },
                  }
                : {
                    icon: ChartNoAxesCombined,
                    title: 'No sales yet',
                    text: 'Share the page that sells it — revenue, sales and views show up here.',
                    action: { label: 'Open landing pages', icon: PanelsTopLeft, to: `/app/${slug}/landing-pages` },
                  }
          }
          stats={(totals) => {
            const extras = seriesLoad.data.series.product
            const share = extras?.creatorRevenueCents ? (totals.revenueCents / extras.creatorRevenueCents) * 100 : 0
            return [
              ['Visitors who bought', percent(totals.views ? (totals.sales / totals.views) * 100 : 0)],
              ['Average order', money(totals.sales ? Math.round(totals.revenueCents / totals.sales) : 0, currency)],
              [
                'Refunds',
                extras && extras.refundCount > 0 ? `${extras.refundCount} · ${money(extras.refundedCents, currency)}` : 'None',
              ],
              ['Share of your revenue', percent(share)],
            ]
          }}
          onMetric={chooseMetric}
        />
      ) : seriesLoad.status === 'error' ? (
        <ErrorState onRetry={retrySeries} />
      ) : (
        <SkeletonBlock />
      )

    return (
      <>
        <PageHeader
          eyebrow="Product analytics"
          title={item.name}
          subtitle={item.description}
          actions={
            <>
              {format && <FileTypeBadge format={format} />}
              {free && <FreeBadge />}
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
          <PageControls
            period={period.id}
            series={seriesLoad.status === 'success' ? seriesLoad.data.series : null}
            loading={seriesLoad.status === 'loading'}
            updatedAt={seriesLoad.status === 'success' ? seriesLoad.data.at : new Date()}
            sinceNote="when you added it"
            onPeriod={setPeriod}
          />
          {boardNode}
          <div className="dash">
            <div className="span-7">
              {free ? (
                <Card
                  title="Latest sign-ups"
                  subtitle={
                    signupsLoad.status === 'success'
                      ? `${plural(signupsLoad.data.total, 'person', 'people')} got it for their email`
                      : 'Everyone who got this document for their email'
                  }
                  action={
                    <Button variant="ghost" icon={ArrowRight} to={`/app/${slug}/subscribers`}>
                      View all
                    </Button>
                  }
                >
                  {signupsLoad.status === 'success' ? (
                    signupsLoad.data.signups.length > 0 ? (
                      <div className="list">
                        {signupsLoad.data.signups.map((capture) => (
                          <PersonRow key={`${capture.email}-${capture.capturedAt}`} name={capture.email}>
                            <span className="cluster cluster--sm">
                              {capture.unsubscribed && <StatusBadge kind="subscriber" value={subscriberStatusKey(true)} />}
                              <span className="table__secondary">{date(capture.capturedAt)}</span>
                            </span>
                          </PersonRow>
                        ))}
                      </div>
                    ) : (
                      <EmptyState compact icon={MailPlus} title="No sign-ups yet" text="Everyone who gets this document for their email appears here." />
                    )
                  ) : signupsLoad.status === 'error' ? (
                    <ErrorState compact onRetry={retry(setSignups, loadSignups)} />
                  ) : (
                    <SkeletonRows count={4} />
                  )}
                </Card>
              ) : (
              <Card
                title="Latest orders"
                subtitle={`${plural(item.paidOrderCount, 'paid order')} for this product`}
                action={
                  item.paidOrderCount > 0 ? (
                    <Button variant="ghost" icon={ArrowRight} to={`/app/${slug}/orders`}>
                      View all
                    </Button>
                  ) : undefined
                }
              >
                {ordersLoad.status === 'success' ? (
                  ordersLoad.data.length > 0 ? (
                    <div className="list">
                      {ordersLoad.data.map((order) => (
                        <PersonRow key={order.publicId} name={order.name ?? order.email ?? 'Customer'} email={order.email}>
                          <span className="person__value">
                            <Money amountCents={order.amountCents} currency={order.currency} />
                          </span>
                          <span className="cluster cluster--sm">
                            {(order.status !== 'Paid' || orderBadgeKey(order) === 'partly') && <StatusBadge kind="order" value={orderBadgeKey(order)} />}
                            <span className="table__secondary">{date(order.createdAt)}</span>
                          </span>
                        </PersonRow>
                      ))}
                    </div>
                  ) : (
                    <EmptyState compact icon={Receipt} title="No orders yet" text="Every order for this product appears here." />
                  )
                ) : ordersLoad.status === 'error' ? (
                  <ErrorState compact onRetry={retry(setOrders, loadLists)} />
                ) : (
                  <SkeletonRows count={4} />
                )}
              </Card>
              )}
            </div>
            <div className="span-5">
              <Card title="About this product">
                <div className="fill-stack">
                  <dl className="kv">
                    <dt>Price</dt>
                    <dd>{free ? 'Free · given away on a lead page' : `${money(item.priceCents, currency)} · one-time`}</dd>
                    <dt>File</dt>
                    <dd>
                      {item.fileName && item.fileSizeBytes !== null ? (
                        <>
                          <span className="file-inline">
                            <FileGlyph fileName={item.fileName} />
                            <span>{item.fileName}</span>
                          </span>
                          <span className="table__secondary">{fileMeta({ fileName: item.fileName, fileSizeBytes: item.fileSizeBytes })}</span>
                        </>
                      ) : (
                        <span className="text-muted">Not uploaded yet</span>
                      )}
                    </dd>
                    <dt>Delivery</dt>
                    <dd>
                      {free
                        ? 'A personal download link by email to everyone who signs up'
                        : 'Downloads right after paying, plus a personal link by email'}
                    </dd>
                    {free ? (
                      <>
                        <dt>Given away</dt>
                        <dd>{signupsLoad.status === 'success' ? plural(signupsLoad.data.total, 'time') : item.signupCount === undefined ? '—' : plural(item.signupCount, 'time')}</dd>
                        <dt>Last sign-up</dt>
                        <dd>{signupsLoad.status === 'success' && signupsLoad.data.signups[0] ? date(signupsLoad.data.signups[0].capturedAt) : '—'}</dd>
                      </>
                    ) : (
                      <>
                        <dt>Sold all time</dt>
                        <dd>
                          {plural(item.paidOrderCount, 'sale')} · {money(item.revenueCents, currency)}
                        </dd>
                        <dt>Last sale</dt>
                        <dd>{lastSaleLoad.status === 'success' && lastSaleLoad.data ? date(lastSaleLoad.data) : '—'}</dd>
                      </>
                    )}
                    <dt>Created</dt>
                    <dd>{date(item.createdAt)}</dd>
                  </dl>
                  <div className="fill-stack__foot product-pages">
                    <span className="field__label">{free ? 'Given away on' : 'Sold on'}</span>
                    {pagesLoad.status === 'success' && pagesLoad.data.length > 0 ? (
                      <div className="list">
                        {pagesLoad.data.map((page) => (
                          <Link
                            className="list__row product-pages__row"
                            to={`/app/${slug}/landing-pages/${page.publicId}`}
                            key={page.publicId}
                          >
                            <PanelsTopLeft />
                            <span className="list__grow">{page.title}</span>
                            <StatusBadge kind="page" value={pageStatusKey(page.status)} />
                          </Link>
                        ))}
                      </div>
                    ) : pagesLoad.status === 'success' ? (
                      <p className="text-sm text-muted">Not on a page yet.</p>
                    ) : pagesLoad.status === 'error' ? (
                      <ErrorState compact onRetry={retry(setPages, loadLists)} />
                    ) : (
                      <SkeletonRows count={2} />
                    )}
                  </div>
                </div>
              </Card>
            </div>
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
