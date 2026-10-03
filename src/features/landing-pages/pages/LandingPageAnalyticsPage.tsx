import { ArrowLeft, ExternalLink, Mail, Pencil, Send } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { date, dateShort, money, month, monthYear, number, percent } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Avatar,
  Bars,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Meter,
  Metric,
  PageHeader,
  Segmented,
  SkeletonBlock,
  SkeletonCards,
  SkeletonRows,
  StatusBadge,
  pageStatusKey,
} from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { getLandingPageAnalytics, getLandingPageTimeSeries, listEmailCaptures } from '../api/landing-pages-api'
import type {
  EmailCaptureItem,
  LandingPageAnalytics,
  PeriodStats,
  TimeSeriesPeriod,
  TimeSeriesPoint,
  TimeSeriesResponse,
} from '../model/types'

type Load<T> = { status: 'loading' } | { status: 'error'; notFound: boolean } | { status: 'success'; data: T }
/** A result tagged with the page (and range) it was loaded for, so a late response never shows on another page. */
type Keyed<T> = { key: string; load: Load<T> }
type ChartMetric = 'views' | 'sales' | 'emails' | 'revenue'

const COLLECTED_EMAILS_SHOWN = 8
const MAX_AXIS_LABELS = 10

const RANGES: Array<{ value: TimeSeriesPeriod; label: string; title: string }> = [
  { value: 'Today', label: '24h', title: 'Last 24 hours' },
  { value: 'Week', label: '7d', title: 'Last 7 days' },
  { value: 'Month', label: '30d', title: 'Last 30 days' },
  { value: 'ThreeMonths', label: '3m', title: 'Last 3 months' },
  { value: 'SixMonths', label: '6m', title: 'Last 6 months' },
  { value: 'Year', label: '1y', title: 'Last 12 months' },
]

const METRICS: Array<{ value: ChartMetric; label: string }> = [
  { value: 'views', label: 'Views' },
  { value: 'sales', label: 'Sales' },
  { value: 'emails', label: 'Emails' },
  { value: 'revenue', label: 'Revenue' },
]

const PERIODS: Array<{ key: 'today' | 'last7Days' | 'last30Days' | 'allTime'; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'last7Days', label: 'Last 7 days' },
  { key: 'last30Days', label: 'Last 30 days' },
  { key: 'allTime', label: 'All time' },
]

const LOADING = { status: 'loading' } as const

function failed(error: unknown): Load<never> {
  return { status: 'error', notFound: error instanceof ApiError && error.status === 404 }
}

const hour = (value: string) => String(new Date(value).getHours()).padStart(2, '0')

/** Axis labels follow the bucket size; at most ~10 are shown, the tooltips always name the bucket in full. */
function bucketLabels(points: TimeSeriesPoint[], bucketUnit: string) {
  const step = Math.max(1, Math.ceil(points.length / MAX_AXIS_LABELS))
  const short = (value: string) =>
    bucketUnit === 'hour' ? hour(value) : bucketUnit === 'month' ? month(value) : dateShort(value)
  const full = (value: string) =>
    bucketUnit === 'hour'
      ? `${dateShort(value)}, ${hour(value)}:00`
      : bucketUnit === 'week'
        ? `Week of ${dateShort(value)}`
        : bucketUnit === 'month'
          ? monthYear(value)
          : date(value)
  return {
    axis: points.map((point, index) => (index % step === 0 ? short(point.bucketStart) : '')),
    tooltips: points.map((point) => full(point.bucketStart)),
  }
}

function chartValue(point: TimeSeriesPoint, metric: ChartMetric) {
  if (metric === 'sales') return point.purchaseCount
  if (metric === 'emails') return point.captureCount
  if (metric === 'revenue') return point.revenueCents
  return point.viewCount
}

export function LandingPageAnalyticsPage() {
  const { slug = '', pageId = '' } = useParams<{ slug: string; pageId: string }>()
  const pageKey = `${slug}/${pageId}`
  const creatorCurrency = useCreatorStore((s) => (s.currentCreator?.slug === slug ? s.currentCreator.defaultCurrency : null))

  const [analytics, setAnalytics] = useState<Keyed<LandingPageAnalytics> | null>(null)
  const [captures, setCaptures] = useState<Keyed<EmailCaptureItem[]> | null>(null)
  const [series, setSeries] = useState<Record<string, Load<TimeSeriesResponse>>>({})
  const [range, setRange] = useState<TimeSeriesPeriod>('Month')
  const [metric, setMetric] = useState<ChartMetric>('views')

  const loadAnalytics = useCallback(() => {
    getLandingPageAnalytics(slug, pageId)
      .then((data) => setAnalytics({ key: pageKey, load: { status: 'success', data } }))
      .catch((error: unknown) => setAnalytics({ key: pageKey, load: failed(error) }))
  }, [slug, pageId, pageKey])

  const loadCaptures = useCallback(() => {
    listEmailCaptures(slug, pageId, COLLECTED_EMAILS_SHOWN)
      .then((data) => setCaptures({ key: pageKey, load: { status: 'success', data } }))
      .catch((error: unknown) => setCaptures({ key: pageKey, load: failed(error) }))
  }, [slug, pageId, pageKey])

  const loadSeries = useCallback(
    (period: TimeSeriesPeriod) => {
      const key = `${pageKey}|${period}`
      getLandingPageTimeSeries(slug, pageId, period)
        .then((data) => setSeries((current) => ({ ...current, [key]: { status: 'success', data } })))
        .catch((error: unknown) => setSeries((current) => ({ ...current, [key]: failed(error) })))
    },
    [slug, pageId, pageKey],
  )

  useEffect(() => {
    if (!slug || !pageId) return
    loadAnalytics()
    loadCaptures()
  }, [slug, pageId, loadAnalytics, loadCaptures])

  // The chart refetches per range (only the chart shows a skeleton); a range already loaded for this page is reused.
  const seriesKey = `${pageKey}|${range}`
  const hasSeries = seriesKey in series
  useEffect(() => {
    if (slug && pageId && !hasSeries) loadSeries(range)
  }, [slug, pageId, range, hasSeries, loadSeries])

  const retry = <T,>(setter: (value: Keyed<T>) => void, load: () => void) => () => {
    setter({ key: pageKey, load: LOADING })
    load()
  }
  const retrySeries = () => {
    setSeries((current) => ({ ...current, [seriesKey]: LOADING }))
    loadSeries(range)
  }

  const analyticsLoad: Load<LandingPageAnalytics> = analytics?.key === pageKey ? analytics.load : LOADING
  const capturesLoad: Load<EmailCaptureItem[]> = captures?.key === pageKey ? captures.load : LOADING
  const seriesLoad: Load<TimeSeriesResponse> = series[seriesKey] ?? LOADING

  const listUrl = `/app/${slug}/landing-pages`

  const body = () => {
    if (analyticsLoad.status === 'loading') {
      return (
        <div className="stack stack--lg">
          <SkeletonCards count={4} />
          <SkeletonBlock />
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
    const formatMoney = (cents: number) => money(cents, currency, { decimals: false })
    const rangeInfo = RANGES.find((option) => option.value === range) ?? RANGES[2]
    const metricLabel = METRICS.find((option) => option.value === metric)?.label ?? 'Views'

    return (
      <>
        <PageHeader
          eyebrow="Landing page"
          title={page.title}
          subtitle={`${window.location.host}${publicPath}`}
          actions={
            <>
              <StatusBadge kind="page" value={pageStatusKey(page.status)} />
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
                Edit
              </Button>
            </>
          }
        />
        <div className="stack stack--lg reveal">
          <div className="grid grid--4">
            {PERIODS.map(({ key, label }) => (
              <PeriodCard key={key} label={label} stats={page[key]} formatMoney={formatMoney} />
            ))}
          </div>

          <Card
            title={`${metricLabel} over time`}
            subtitle={rangeInfo.title}
            action={
              <>
                <Segmented
                  label="Metric"
                  options={METRICS}
                  value={metric}
                  onChange={(value) => setMetric(value as ChartMetric)}
                />
                <Segmented
                  label="Range"
                  options={RANGES}
                  value={range}
                  onChange={(value) => setRange(value as TimeSeriesPeriod)}
                />
              </>
            }
          >
            {seriesLoad.status === 'success' ? (
              <SeriesBars
                series={seriesLoad.data}
                metric={metric}
                formatValue={metric === 'revenue' ? formatMoney : number}
                label={`${metricLabel}, ${rangeInfo.title.toLowerCase()}`}
              />
            ) : seriesLoad.status === 'error' ? (
              <ErrorState compact onRetry={retrySeries} />
            ) : (
              <SkeletonBlock />
            )}
          </Card>

          <div className="grid grid--2">
            <Card title="Conversion">
              <Conversion stats={page.allTime} />
            </Card>
            <Card
              title="Collected emails"
              action={
                <Button variant="secondary" icon={Send} to={`/app/${slug}/emails`}>
                  Send email
                </Button>
              }
            >
              {capturesLoad.status === 'success' ? (
                <CollectedEmails
                  captures={capturesLoad.data}
                  subscribersUrl={`/app/${slug}/subscribers?source=${pageId}`}
                />
              ) : capturesLoad.status === 'error' ? (
                <ErrorState compact onRetry={retry(setCaptures, loadCaptures)} />
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
    <AppShell slug={slug} activeSection="landing-pages" documentTitle="Page analytics · Luma">
      {body()}
    </AppShell>
  )
}

function PeriodCard({
  label,
  stats,
  formatMoney,
}: {
  label: string
  stats: PeriodStats
  formatMoney: (cents: number) => string
}) {
  return (
    <article className="card">
      <div className="card__body stack stack--md">
        <span className="eyebrow">{label}</span>
        <div className="grid grid--2">
          <Metric card={false} label="Views" value={number(stats.totalViews)} />
          <Metric card={false} label="Sales" value={number(stats.purchaseCount)} />
          <Metric card={false} label="Emails" value={number(stats.captureCount)} />
          <Metric card={false} label="Revenue" value={formatMoney(stats.revenueCents)} />
        </div>
      </div>
    </article>
  )
}

function SeriesBars({
  series,
  metric,
  formatValue,
  label,
}: {
  series: TimeSeriesResponse
  metric: ChartMetric
  formatValue: (value: number) => string
  label: string
}) {
  const { axis, tooltips } = bucketLabels(series.points, series.bucketUnit)
  return (
    <Bars
      values={series.points.map((point) => chartValue(point, metric))}
      labels={axis}
      tooltipLabels={tooltips}
      formatValue={formatValue}
      label={label}
    />
  )
}

function Conversion({ stats }: { stats: PeriodStats }) {
  const views = stats.totalViews
  return (
    <div className="stack">
      <Meter label="Views → purchase" used={views > 0 ? stats.purchaseCount : 0} limit={views} />
      <Meter label="Views → email" used={views > 0 ? stats.captureCount : 0} limit={views} />
      <p className="text-sm text-secondary">
        {views > 0
          ? `${percent((stats.purchaseCount / views) * 100)} buy · ${percent((stats.captureCount / views) * 100)} leave an email`
          : 'No views yet'}
      </p>
    </div>
  )
}

function CollectedEmails({ captures, subscribersUrl }: { captures: EmailCaptureItem[]; subscribersUrl: string }) {
  if (captures.length === 0) {
    return <EmptyState compact icon={Mail} title="No emails yet" text="Sign-ups from this page will show up here." />
  }
  return (
    <div className="stack">
      <div className="list">
        {captures.map((capture) => (
          <div className="list__row" key={`${capture.email}-${capture.capturedAt}`}>
            <Avatar size="xs" neutral>
              {capture.email.charAt(0).toUpperCase()}
            </Avatar>
            <span className="list__grow">{capture.email}</span>
            <span className="text-xs text-muted">{date(capture.capturedAt)}</span>
          </div>
        ))}
      </div>
      <Link className="link text-sm" to={subscribersUrl}>
        View all in Subscribers
      </Link>
    </div>
  )
}
