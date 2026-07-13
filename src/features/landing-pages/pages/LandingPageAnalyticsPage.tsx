import { ArrowLeft, BarChart3, ChevronDown, Eye, Globe, Loader2, Mail, Pencil, ShoppingBag, Users, Wallet } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getLandingPageTimeSeries, listEmailCaptures } from '../api/landing-pages-api'
import { AppShell } from '../../../shared/ui/AppShell'
import { useLandingPageStore } from '../model/landing-page-store'
import type { EmailCaptureItem, PeriodStats, TimeSeriesPeriod, TimeSeriesResponse } from '../model/types'

export function LandingPageAnalyticsPage() {
  const navigate = useNavigate()
  const { slug, pageId } = useParams<{ slug: string; pageId: string }>()

  const currentPage = useLandingPageStore((s) => s.pageSummary)
  const pageStatus = useLandingPageStore((s) => s.pageSummaryStatus)
  const pageError = useLandingPageStore((s) => s.pageSummaryError)
  const loadPage = useLandingPageStore((s) => s.loadPageSummary)
  const analytics = useLandingPageStore((s) => s.analytics)
  const loadAnalytics = useLandingPageStore((s) => s.loadAnalytics)

  useEffect(() => {
    if (!slug || !pageId) return
    if (pageStatus === 'idle' || (pageStatus === 'success' && currentPage?.publicId !== pageId)) {
      void loadPage(slug, pageId)
    }
  }, [slug, pageId, pageStatus, currentPage, loadPage])

  useEffect(() => {
    if (!slug || !pageId) return
    void loadAnalytics(slug, pageId)
  }, [slug, pageId, loadAnalytics])

  if (!slug || !pageId) return null

  const isLoading = pageStatus === 'idle' || pageStatus === 'loading'
  const pageAnalytics = analytics[pageId] ?? null

  const [captures, setCaptures] = useState<EmailCaptureItem[] | null>(null)
  const [capturesStatus, setCapturesStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleLoadCaptures = () => {
    if (!slug || !pageId) return
    setCapturesStatus('loading')
    listEmailCaptures(slug, pageId)
      .then((data) => { setCaptures(data); setCapturesStatus('success') })
      .catch(() => setCapturesStatus('error'))
  }

  return (
    <AppShell slug={slug} activeSection="landing-pages">
      <div className="px-8 py-8">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading…
          </div>
        ) : pageStatus === 'error' ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
            <p className="text-sm font-semibold text-white light:text-neutral-950">{pageError ?? 'Something went wrong.'}</p>
            <button
              type="button"
              className="mt-4 text-sm text-white/50 hover:text-white light:text-neutral-500 light:hover:text-neutral-800"
              onClick={() => navigate(`/app/${slug}/landing-pages`)}
            >
              ← Back to landing pages
            </button>
          </div>
        ) : currentPage ? (
          <div className="grid gap-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate(`/app/${slug}/landing-pages`)}
                  className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white light:border-neutral-200 light:bg-white light:text-neutral-500 light:shadow-sm light:hover:bg-neutral-50 light:hover:text-neutral-800"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-white light:text-neutral-950">
                    {currentPage.title}
                  </h1>
                  <p className="mt-0.5 text-sm text-white/40 light:text-neutral-400">/{currentPage.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentPage.status === 'Published' ? (
                  <a
                    href={`/p/${slug}/${currentPage.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-600 light:shadow-sm light:hover:bg-neutral-50"
                  >
                    <Globe size={14} />
                    View live
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate(`/app/${slug}/landing-pages/${pageId}/edit`)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong"
                >
                  <Pencil size={14} />
                  Edit page
                </button>
              </div>
            </div>

            {/* Analytics cards */}
            {pageAnalytics === null ? (
              <div className="flex h-32 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
                <Loader2 className="animate-spin" size={16} />
                Loading analytics…
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <PeriodCard label="Today" stats={pageAnalytics.today} />
                  <PeriodCard label="Last 7 days" stats={pageAnalytics.last7Days} />
                  <PeriodCard label="Last 30 days" stats={pageAnalytics.last30Days} />
                  <PeriodCard label="All time" stats={pageAnalytics.allTime} highlight />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <PurchasesCard count={pageAnalytics.purchaseCount} />
                  <RevenueCard totalCents={pageAnalytics.totalRevenueCents} currency={pageAnalytics.currency} />
                  <EmailCapturesCard total={pageAnalytics.totalEmailCaptures} />
                </div>

                <TimeSeriesCharts slug={slug} pageId={pageId} />

                {/* Email list — lazy loaded */}
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 light:border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Mail size={15} className="text-white/40 light:text-neutral-400" />
                      <p className="text-sm font-semibold text-white light:text-neutral-950">Captured emails</p>
                    </div>
                    {capturesStatus === 'idle' ? (
                      <button
                        type="button"
                        onClick={handleLoadCaptures}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-600 light:hover:bg-neutral-50"
                      >
                        <ChevronDown size={13} />
                        Show emails
                      </button>
                    ) : null}
                  </div>

                  {capturesStatus === 'idle' ? (
                    <div className="flex items-center justify-center py-10 text-sm text-white/40 light:text-neutral-400">
                      Click "Show emails" to load the list
                    </div>
                  ) : capturesStatus === 'loading' ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/40 light:text-neutral-400">
                      <Loader2 className="animate-spin" size={15} />
                      Loading…
                    </div>
                  ) : capturesStatus === 'error' ? (
                    <div className="flex items-center justify-center py-10 text-sm text-red-400 light:text-red-500">
                      Failed to load. Try again.
                    </div>
                  ) : captures !== null && captures.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-sm text-white/40 light:text-neutral-400">
                      No emails captured yet.
                    </div>
                  ) : (
                    <ul className="divide-y divide-white/10 light:divide-neutral-100">
                      {captures?.map((c) => (
                        <li key={c.email} className="flex items-center justify-between px-5 py-3">
                          <span className="text-sm text-white light:text-neutral-950">{c.email}</span>
                          <span className="text-xs text-white/40 light:text-neutral-400">
                            {new Date(c.capturedAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function PurchasesCard({ count }: { count: number }) {
  const total = count ?? 0
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Purchases</p>
      <div className="mt-4 flex items-center gap-2">
        <ShoppingBag size={14} className="text-white/40 light:text-neutral-400" />
        <span className="text-2xl font-bold tabular-nums text-white light:text-neutral-950">{total.toLocaleString()}</span>
        <span className="text-xs text-white/40 light:text-neutral-400">paid orders</span>
      </div>
    </div>
  )
}

function RevenueCard({ totalCents, currency }: { totalCents: number; currency: string | null }) {
  const formatted = ((totalCents ?? 0) / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: currency ?? 'EUR',
  })
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Revenue</p>
      <div className="mt-4 flex items-center gap-2">
        <Wallet size={14} className="text-white/40 light:text-neutral-400" />
        <span className="text-2xl font-bold tabular-nums text-white light:text-neutral-950">{formatted}</span>
      </div>
    </div>
  )
}

function EmailCapturesCard({ total }: { total: number }) {
  const count = total ?? 0
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">Email captures</p>
      <div className="mt-4 flex items-center gap-2">
        <Mail size={14} className="text-white/40 light:text-neutral-400" />
        <span className="text-2xl font-bold tabular-nums text-white light:text-neutral-950">{count.toLocaleString()}</span>
        <span className="text-xs text-white/40 light:text-neutral-400">unique emails</span>
      </div>
    </div>
  )
}

/* ─── Time series charts ─────────────────────────────────────── */

const PERIOD_OPTIONS: { value: TimeSeriesPeriod; label: string }[] = [
  { value: 'Today', label: '24h' },
  { value: 'Week', label: '7d' },
  { value: 'Month', label: '30d' },
  { value: 'ThreeMonths', label: '3m' },
  { value: 'SixMonths', label: '6m' },
  { value: 'Year', label: '1y' },
  { value: 'AllTime', label: 'All' },
]

const axisProps = {
  tick: { fill: 'rgba(255,255,255,0.45)', fontSize: 11 },
  tickLine: false,
  axisLine: false,
  stroke: 'rgba(255,255,255,0.15)',
} as const

function TimeSeriesCharts({ slug, pageId }: { slug: string; pageId: string }) {
  const [period, setPeriod] = useState<TimeSeriesPeriod>('Month')
  const [data, setData] = useState<TimeSeriesResponse | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    getLandingPageTimeSeries(slug, pageId, period)
      .then((res) => { if (!cancelled) { setData(res); setStatus('success') } })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [slug, pageId, period])

  const bucketUnit = data?.bucketUnit ?? 'day'
  const currency = data?.currency ?? 'EUR'
  const points = data?.points ?? []

  const totalViews = points.reduce((sum, p) => sum + p.viewCount, 0)
  const totalCaptures = points.reduce((sum, p) => sum + p.captureCount, 0)
  const totalPurchases = points.reduce((sum, p) => sum + p.purchaseCount, 0)
  const totalRevenueCents = points.reduce((sum, p) => sum + p.revenueCents, 0)

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-white/40 light:text-neutral-400" />
          <h2 className="text-sm font-semibold text-white light:text-neutral-950">Trends</h2>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 light:border-neutral-200 light:bg-white">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                period === opt.value
                  ? 'bg-accent text-white light:text-neutral-950'
                  : 'text-white/50 hover:text-white light:text-neutral-500 light:hover:text-neutral-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative grid gap-4 lg:grid-cols-3">
        {status === 'loading' ? (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-neutral-950/40 backdrop-blur-[1px]">
            <Loader2 className="animate-spin text-white/60" size={20} />
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="col-span-full rounded-2xl border border-red-500/25 bg-red-500/10 p-6 text-sm text-red-300 light:border-red-200 light:bg-red-50 light:text-red-700">
            Failed to load charts. Try another period.
          </div>
        ) : (
          <>
            <ChartCard title="Views" total={totalViews.toLocaleString()}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={points} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="bucketStart" tickFormatter={(v: string) => formatBucket(v, bucketUnit)} minTickGap={24} {...axisProps} />
                  <YAxis allowDecimals={false} width={34} {...axisProps} />
                  <Tooltip content={<DarkTooltip bucketUnit={bucketUnit} currency={currency} />} />
                  <Line type="monotone" dataKey="viewCount" name="Views" stroke="#4C7CF0" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="uniqueVisitors" name="Unique" stroke="#5EEAD4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Email captures" total={totalCaptures.toLocaleString()}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={points} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="bucketStart" tickFormatter={(v: string) => formatBucket(v, bucketUnit)} minTickGap={24} {...axisProps} />
                  <YAxis allowDecimals={false} width={34} {...axisProps} />
                  <Tooltip content={<DarkTooltip bucketUnit={bucketUnit} currency={currency} />} />
                  <Line type="monotone" dataKey="captureCount" name="Captures" stroke="#7CA2FF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Purchases & revenue" total={totalPurchases.toLocaleString()} sub={formatMoney(totalRevenueCents, currency)}>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={points} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="bucketStart" tickFormatter={(v: string) => formatBucket(v, bucketUnit)} minTickGap={24} {...axisProps} />
                  <YAxis yAxisId="left" allowDecimals={false} width={34} {...axisProps} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => String(v / 100)} width={40} {...axisProps} />
                  <Tooltip content={<DarkTooltip bucketUnit={bucketUnit} currency={currency} />} />
                  <Bar yAxisId="left" dataKey="purchaseCount" name="Purchases" fill="#4C7CF0" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Line yAxisId="right" type="monotone" dataKey="revenueCents" name="Revenue" stroke="#34D399" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </>
        )}
      </div>
    </div>
  )
}

function ChartCard({ title, total, sub, children }: { title: string; total?: string; sub?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40 light:text-neutral-400">{title}</p>
      {total !== undefined ? (
        <div className="mb-3 mt-0.5 flex items-baseline gap-2">
          <p className="text-2xl font-bold tabular-nums text-white light:text-neutral-950">{total}</p>
          {sub !== undefined ? (
            <p className="text-sm font-semibold tabular-nums text-emerald-400 light:text-emerald-600">{sub}</p>
          ) : null}
        </div>
      ) : (
        <div className="mb-3" />
      )}
      {children}
    </div>
  )
}

type TooltipEntry = { dataKey?: string | number; name?: string; value?: number; color?: string }

function DarkTooltip({
  active,
  payload,
  label,
  bucketUnit,
  currency,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  bucketUnit: string
  currency: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-white">{label ? formatBucketFull(label, bucketUnit) : ''}</p>
      {payload.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center gap-2 text-white/70">
          <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}:{' '}
          <span className="font-semibold text-white">
            {entry.dataKey === 'revenueCents' ? formatMoney(entry.value ?? 0, currency) : entry.value}
          </span>
        </p>
      ))}
    </div>
  )
}

function formatBucket(iso: string, unit: string): string {
  const d = new Date(iso)
  if (unit === 'hour') return d.toLocaleTimeString(undefined, { hour: '2-digit' })
  if (unit === 'month') return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function formatBucketFull(iso: string, unit: string): string {
  const d = new Date(iso)
  if (unit === 'hour') return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  if (unit === 'month') return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMoney(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, { style: 'currency', currency })
}

function PeriodCard({
  label,
  stats,
  highlight = false,
}: {
  label: string
  stats: PeriodStats
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? 'border-accent/50 bg-accent/[0.12] light:border-neutral-950 light:bg-neutral-950 light:shadow-sm'
          : 'border-white/10 bg-white/[0.03] backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm'
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-widest ${highlight ? 'text-white/50' : 'text-white/40 light:text-neutral-400'}`}>
        {label}
      </p>
      <div className="mt-4 grid gap-3">
        <div className="flex items-center gap-2">
          <Eye size={14} className={highlight ? 'text-white/60' : 'text-white/40 light:text-neutral-400'} />
          <span className={`text-2xl font-bold tabular-nums ${highlight ? 'text-white' : 'text-white light:text-neutral-950'}`}>
            {stats.totalViews.toLocaleString()}
          </span>
          <span className={`text-xs ${highlight ? 'text-white/40' : 'text-white/40 light:text-neutral-400'}`}>views</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className={highlight ? 'text-white/60' : 'text-white/40 light:text-neutral-400'} />
          <span className={`text-2xl font-bold tabular-nums ${highlight ? 'text-white' : 'text-white light:text-neutral-950'}`}>
            {stats.uniqueVisitors.toLocaleString()}
          </span>
          <span className={`text-xs ${highlight ? 'text-white/40' : 'text-white/40 light:text-neutral-400'}`}>unique</span>
        </div>
      </div>
    </div>
  )
}
