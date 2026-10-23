import { ArrowLeft, ArrowRight, ChartNoAxesCombined, Copy, ExternalLink, MailPlus, Pencil, Send, ShoppingBag } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { date, money, percent, plural } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Money,
  PageHeader,
  SkeletonBlock,
  SkeletonRows,
  StatusBadge,
  pageStatusKey,
  subscriberStatusKey,
  useToast,
} from '../../../shared/ui/ledger'
import { getAnalyticsSeries } from '../../analytics/api/series-api'
import { AnalyticsBoard } from '../../analytics/components/AnalyticsBoard'
import { PersonRow } from '../../analytics/components/PersonRow'
import { PageControls } from '../../analytics/components/PageControls'
import { metricById } from '../../analytics/model/series'
import type { AnalyticsMetric, AnalyticsPeriod, AnalyticsSeries } from '../../analytics/model/types'
import { usePagePeriod } from '../../analytics/model/use-page-period'
import { useCreatorStore } from '../../creators/model/creator-store'
import { listOrders } from '../../orders/api/orders-api'
import type { Order } from '../../orders/model/types'
import { getLandingPageAnalytics, listEmailCaptures } from '../api/landing-pages-api'
import type { EmailCaptureItem, LandingPageAnalytics } from '../model/types'

type Load<T> = { status: 'loading' } | { status: 'error'; notFound: boolean } | { status: 'success'; data: T }
/** A result tagged with the page (and period) it was loaded for, so a late response never shows on another page. */
type Keyed<T> = { key: string; load: Load<T> }
type Loaded = { series: AnalyticsSeries; at: Date }

const LATEST_ROWS = 5
const DEFAULT_METRIC: AnalyticsMetric = 'views'
const LOADING = { status: 'loading' } as const

function failed(error: unknown): Load<never> {
  return { status: 'error', notFound: error instanceof ApiError && error.status === 404 }
}

export function LandingPageAnalyticsPage() {
  const { slug = '', pageId = '' } = useParams<{ slug: string; pageId: string }>()
  const pageKey = `${slug}/${pageId}`
  const toast = useToast()
  const creatorCurrency = useCreatorStore((s) => (s.currentCreator?.slug === slug ? s.currentCreator.defaultCurrency : null))
  const { period, setPeriod, params, update } = usePagePeriod('landing-page-analytics')
  const metric = metricById(params.get('metric'), DEFAULT_METRIC).id

  const [analytics, setAnalytics] = useState<Keyed<LandingPageAnalytics> | null>(null)
  const [captures, setCaptures] = useState<Keyed<EmailCaptureItem[]> | null>(null)
  const [sales, setSales] = useState<Keyed<Order[]> | null>(null)
  const [series, setSeries] = useState<Record<string, Load<Loaded>>>({})

  const loadAnalytics = useCallback(() => {
    getLandingPageAnalytics(slug, pageId)
      .then((data) => setAnalytics({ key: pageKey, load: { status: 'success', data } }))
      .catch((error: unknown) => setAnalytics({ key: pageKey, load: failed(error) }))
  }, [slug, pageId, pageKey])

  const loadLatest = useCallback(() => {
    listEmailCaptures(slug, pageId, LATEST_ROWS)
      .then((data) => setCaptures({ key: pageKey, load: { status: 'success', data } }))
      .catch((error: unknown) => setCaptures({ key: pageKey, load: failed(error) }))
    listOrders(slug, { landingPageId: pageId, status: 'Paid', limit: LATEST_ROWS })
      .then((data) => setSales({ key: pageKey, load: { status: 'success', data: data.orders } }))
      .catch((error: unknown) => setSales({ key: pageKey, load: failed(error) }))
  }, [slug, pageId, pageKey])

  const loadSeries = useCallback(
    (id: AnalyticsPeriod) => {
      const key = `${pageKey}|${id}`
      getAnalyticsSeries(slug, 'page', pageId, id)
        .then((data) => setSeries((current) => ({ ...current, [key]: { status: 'success', data: { series: data, at: new Date() } } })))
        .catch((error: unknown) => setSeries((current) => ({ ...current, [key]: failed(error) })))
    },
    [slug, pageId, pageKey],
  )

  useEffect(() => {
    if (!slug || !pageId) return
    loadAnalytics()
    loadLatest()
  }, [slug, pageId, loadAnalytics, loadLatest])

  // Each period is fetched once per page; going back to one already loaded reuses it.
  const seriesKey = `${pageKey}|${period.id}`
  const hasSeries = seriesKey in series
  useEffect(() => {
    if (slug && pageId && !hasSeries) loadSeries(period.id)
  }, [slug, pageId, period.id, hasSeries, loadSeries])

  const chooseMetric = (next: AnalyticsMetric) => update({ metric: next === DEFAULT_METRIC ? null : next })

  const retry = <T,>(setter: (value: Keyed<T>) => void, load: () => void) => () => {
    setter({ key: pageKey, load: LOADING })
    load()
  }
  const retrySeries = () => {
    setSeries((current) => ({ ...current, [seriesKey]: LOADING }))
    loadSeries(period.id)
  }

  const analyticsLoad: Load<LandingPageAnalytics> = analytics?.key === pageKey ? analytics.load : LOADING
  const capturesLoad: Load<EmailCaptureItem[]> = captures?.key === pageKey ? captures.load : LOADING
  const salesLoad: Load<Order[]> = sales?.key === pageKey ? sales.load : LOADING
  const seriesLoad: Load<Loaded> = series[seriesKey] ?? LOADING

  const listUrl = `/app/${slug}/landing-pages`

  const body = () => {
    if (analyticsLoad.status === 'loading') {
      return (
        <div className="stack stack--lg">
          <SkeletonBlock />
          <SkeletonRows count={4} />
        </div>
      )
    }
    if (analyticsLoad.status === 'error') {
      return analyticsLoad.notFound ? (
        <ErrorState
          title="Page not found"
          text="This landing page doesn’t exist or isn’t part of your workspace."
          action={{ label: 'Back to landing pages', icon: ArrowLeft, to: listUrl }}
        />
      ) : (
        <ErrorState onRetry={retry(setAnalytics, loadAnalytics)} />
      )
    }

    const page = analyticsLoad.data
    const currency = page.currency ?? creatorCurrency ?? 'EUR'
    const publicPath = `/p/${slug}/${page.slug}`
    const words = page.title.split(' ')
    const lastWord = words.pop() ?? ''
    const never = page.allTime.totalViews === 0 && page.allTime.purchaseCount === 0 && page.allTime.captureCount === 0
    const copyLink = async () => {
      const url = `${window.location.origin}${publicPath}`
      try {
        await navigator.clipboard.writeText(url)
        toast({ tone: 'success', title: 'Link copied' })
      } catch {
        toast({ tone: 'danger', title: 'Couldn’t copy the link', message: url })
      }
    }

    const boardNode =
      seriesLoad.status === 'success' ? (
        <AnalyticsBoard
          series={seriesLoad.data.series}
          metric={metric}
          order={['views', 'emails', 'sales', 'revenue']}
          name="Page performance"
          empty={
            never
              ? {
                  icon: ChartNoAxesCombined,
                  title: 'No visits yet',
                  text: 'Share your page link — views, sign-ups and sales show up here within minutes.',
                  action: { label: 'Copy page link', icon: Copy, onClick: () => void copyLink() },
                }
              : undefined
          }
          stats={(totals) => {
            const rate = (part: number) => percent(totals.views ? (part / totals.views) * 100 : 0)
            return [
              ['Visitors who left an email', rate(totals.emails)],
              ['Visitors who bought', rate(totals.sales)],
              ['Average order', money(totals.sales ? Math.round(totals.revenueCents / totals.sales) : 0, currency)],
              ['Revenue per view', money(totals.views ? Math.round(totals.revenueCents / totals.views) : 0, currency)],
            ]
          }}
          onMetric={chooseMetric}
        />
      ) : seriesLoad.status === 'error' ? (
        <ErrorState onRetry={retrySeries} />
      ) : (
        <>
          <SkeletonBlock />
        </>
      )

    return (
      <>
        <PageHeader
          eyebrow="Landing page analytics"
          title={
            <>
              {words.length > 0 && `${words.join(' ')} `}
              <em>{lastWord}</em>
            </>
          }
          subtitle={`${window.location.host}${publicPath}`}
          actions={
            <>
              <StatusBadge kind="page" value={pageStatusKey(page.status)} />
              <Button variant="ghost" size="sm" iconOnly icon={Copy} aria-label="Copy page link" data-tooltip="Copy page link" onClick={() => void copyLink()} />
              <Button
                variant="secondary"
                icon={ExternalLink}
                href={publicPath}
                target="_blank"
                rel="noopener"
                disabledReason={page.status === 'Published' ? undefined : 'Publish the page to open it.'}
              >
                Open page
              </Button>
              <Button variant="primary" icon={Pencil} to={`/app/${slug}/landing-pages/${pageId}/edit`}>
                Edit page
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
            sinceNote="when the page went live"
            onPeriod={setPeriod}
          />
          {boardNode}
          <div className="dash">
            <div className="span-6">
              <Card
                title="Latest sales"
                subtitle={`${plural(page.allTime.purchaseCount, 'paid order')} through this page`}
                action={
                  page.allTime.purchaseCount > 0 ? (
                    <Button variant="ghost" icon={ArrowRight} to={`/app/${slug}/orders`}>
                      View all
                    </Button>
                  ) : undefined
                }
              >
                {salesLoad.status === 'success' ? (
                  <LatestSales orders={salesLoad.data} />
                ) : salesLoad.status === 'error' ? (
                  <ErrorState compact onRetry={retry(setSales, loadLatest)} />
                ) : (
                  <SkeletonRows count={4} />
                )}
              </Card>
            </div>
            <div className="span-6">
              <Card
                title="Latest sign-ups"
                subtitle={`${plural(page.allTime.captureCount, 'person', 'people')} joined through this page`}
                action={
                  page.allTime.captureCount > 0 ? (
                    <Button variant="ghost" icon={Send} to={`/app/${slug}/emails`}>
                      Email all {page.allTime.captureCount}
                    </Button>
                  ) : undefined
                }
              >
                {capturesLoad.status === 'success' ? (
                  <LatestSignups captures={capturesLoad.data} subscribersUrl={`/app/${slug}/subscribers?source=${pageId}`} />
                ) : capturesLoad.status === 'error' ? (
                  <ErrorState compact onRetry={retry(setCaptures, loadLatest)} />
                ) : (
                  <SkeletonRows count={4} />
                )}
              </Card>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <AppShell slug={slug} activeSection="landing-pages" documentTitle="Page analytics · Luma">
      {body()}
    </AppShell>
  )
}

function LatestSales({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <EmptyState compact icon={ShoppingBag} title="No sales yet" text="Orders placed on this page appear here." />
  }
  return (
    <div className="list">
      {orders.map((order) => (
        <PersonRow key={order.publicId} name={order.name ?? order.email ?? 'Customer'} email={order.email}>
          <span className="person__value">
            <Money amountCents={order.amountCents} currency={order.currency} />
          </span>
          <span className="table__secondary">{date(order.paidAt ?? order.createdAt)}</span>
        </PersonRow>
      ))}
    </div>
  )
}

function LatestSignups({ captures, subscribersUrl }: { captures: EmailCaptureItem[]; subscribersUrl: string }) {
  if (captures.length === 0) {
    return <EmptyState compact icon={MailPlus} title="No emails yet" text="People who buy or sign up on this page appear here." />
  }
  return (
    <div className="stack">
      <div className="list">
        {captures.map((capture) => (
          <PersonRow key={`${capture.email}-${capture.capturedAt}`} name={capture.email}>
            <StatusBadge kind="subscriber" value={subscriberStatusKey(capture.unsubscribed)} />
            <span className="table__secondary">{date(capture.capturedAt)}</span>
          </PersonRow>
        ))}
      </div>
      <Link className="link text-sm" to={subscribersUrl}>
        View all in Subscribers
      </Link>
    </div>
  )
}
