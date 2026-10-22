import { ArrowRight, Package, Plus, Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { date, money, month, number, plural } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import {
  Bars,
  Button,
  Card,
  Delta,
  EmptyState,
  ErrorState,
  HBars,
  Money,
  PageHeader,
  Segmented,
  SkeletonBlock,
  SkeletonCards,
  SkeletonRows,
  Sparkline,
} from '../../../shared/ui/ledger'
import { useAuthStore } from '../../auth/model/auth-store'
import { getDashboardTrends, getHomeSummary } from '../../orders/api/orders-api'
import { OrdersTable } from '../../orders/components/OrdersTable'
import type { DashboardTrendRange, DashboardTrends, HomeSummary } from '../../orders/model/types'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { listProducts } from '../../products/api/products-api'
import type { LandingPage } from '../../landing-pages/model/types'
import type { Product } from '../../products/model/types'
import { useCreatorStore } from '../model/creator-store'
import { PlanUsageCard } from '../components/dashboard/PlanUsageCard'
import { SalesBoard } from '../components/dashboard/SalesBoard'
import { TopPagesCard } from '../components/dashboard/TopPagesCard'
import type { Creator, CreatorPlan } from '../model/types'

type Load<T> = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: T }

const RANGES: Array<{ value: DashboardTrendRange; label: string }> = [
  { value: '30d', label: '30d' },
  { value: '6m', label: '6m' },
  { value: '12m', label: '12m' },
]

function greeting(now = new Date()) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function CreatorWorkspacePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const firstName = useAuthStore((s) => s.currentUser?.firstName)
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)
  const pages = useLandingPageStore((s) => s.pages)
  const loadPages = useLandingPageStore((s) => s.loadPages)

  const [summary, setSummary] = useState<Load<HomeSummary>>({ status: 'loading' })
  const [products, setProducts] = useState<Product[]>([])
  const [trends, setTrends] = useState<Partial<Record<DashboardTrendRange, Load<DashboardTrends>>>>({
    '12m': { status: 'loading' },
  })
  const [loadedSlug, setLoadedSlug] = useState(slug)
  const [heroRange, setHeroRange] = useState<DashboardTrendRange>('12m')
  const [barsMetric, setBarsMetric] = useState<'revenue' | 'views'>('revenue')

  // Another workspace's address starts over (render-time reset, so no stale numbers flash).
  if (loadedSlug !== slug) {
    setLoadedSlug(slug)
    setSummary({ status: 'loading' })
    setProducts([])
    setTrends({ '12m': { status: 'loading' } })
  }

  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  const retrySummary = async () => {
    setSummary({ status: 'loading' })
    try {
      setSummary({ status: 'success', data: await getHomeSummary(slug) })
    } catch {
      setSummary({ status: 'error' })
    }
  }

  const loadTrend = useCallback(
    async (range: DashboardTrendRange) => {
      setTrends((current) => ({ ...current, [range]: { status: 'loading' } }))
      try {
        const data = await getDashboardTrends(slug, range)
        setTrends((current) => ({ ...current, [range]: { status: 'success', data } }))
      } catch {
        setTrends((current) => ({ ...current, [range]: { status: 'error' } }))
      }
    },
    [slug],
  )

  useEffect(() => {
    if (!slug) return
    let active = true
    getHomeSummary(slug)
      .then((data) => active && setSummary({ status: 'success', data }))
      .catch(() => active && setSummary({ status: 'error' }))
    getDashboardTrends(slug, '12m')
      .then((data) => active && setTrends((current) => ({ ...current, '12m': { status: 'success', data } })))
      .catch(() => active && setTrends((current) => ({ ...current, '12m': { status: 'error' } })))
    void loadPages(slug)
    listProducts(slug)
      .then((list) => active && setProducts(list))
      .catch(() => active && setProducts([]))
    return () => {
      active = false
    }
  }, [slug, loadPages])

  const selectHeroRange = (range: DashboardTrendRange) => {
    setHeroRange(range)
    if (!trends[range] || trends[range]?.status === 'error') void loadTrend(range)
  }

  if (!slug) return null

  return (
    <AppShell slug={slug} activeSection="overview">
      {creatorLoading ? (
        <SkeletonCards count={4} />
      ) : !creator ? (
        <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
      ) : (
        <>
          <PageHeader
            eyebrow={date(new Date())}
            title={
              <>
                {greeting()}, <em>{firstName}</em>
              </>
            }
            subtitle={`Here is how ${creator.name} is doing today.`}
            actions={
              <>
                <Button variant="secondary" icon={Plus} to={`/app/${slug}/landing-pages`}>
                  New landing page
                </Button>
                <Button variant="primary" icon={Package} to={`/app/${slug}/products`}>
                  New product
                </Button>
              </>
            }
          />
          {summary.status === 'error' ? (
            <ErrorState onRetry={() => void retrySummary()} />
          ) : (
            <Dashboard
              creator={creator}
              plan={creatorPlans.find((plan) => plan.code === creator.planCode)}
              summary={summary.status === 'success' ? summary.data : null}
              products={products}
              pages={pages}
              trend12m={trends['12m']}
              heroTrend={trends[heroRange]}
              heroRange={heroRange}
              onHeroRange={selectHeroRange}
              barsMetric={barsMetric}
              onBarsMetric={setBarsMetric}
              onRetryTrend={(range) => void loadTrend(range)}
            />
          )}
        </>
      )}
    </AppShell>
  )
}

function Dashboard({
  creator,
  plan,
  summary,
  products,
  pages,
  trend12m,
  heroTrend,
  heroRange,
  onHeroRange,
  barsMetric,
  onBarsMetric,
  onRetryTrend,
}: {
  creator: Creator
  plan: CreatorPlan | undefined
  summary: HomeSummary | null
  products: Product[]
  pages: LandingPage[]
  trend12m: Load<DashboardTrends> | undefined
  heroTrend: Load<DashboardTrends> | undefined
  heroRange: DashboardTrendRange
  onHeroRange: (range: DashboardTrendRange) => void
  barsMetric: 'revenue' | 'views'
  onBarsMetric: (metric: 'revenue' | 'views') => void
  onRetryTrend: (range: DashboardTrendRange) => void
}) {
  const slug = creator.slug
  const currency = summary?.currency ?? creator.defaultCurrency ?? 'EUR'
  const formatMoney = (cents: number) => money(cents, currency)
  const planName = creator.planName
  const limit = (key: string) => plan?.limits[key]

  // "vs last month" comes from the last two monthly points of the 12-month trend.
  const months12 = trend12m?.status === 'success' ? trend12m.data.points : null
  const thisMonthCents = months12?.at(-1)?.revenueCents ?? summary?.thisMonthRevenueCents ?? 0
  const lastMonthCents = months12 && months12.length > 1 ? months12[months12.length - 2].revenueCents : null
  const change =
    lastMonthCents !== null && lastMonthCents > 0 ? ((thisMonthCents - lastMonthCents) / lastMonthCents) * 100 : null

  const byProduct = products
    .filter((product) => product.revenueCents > 0)
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .map((product) => ({ label: product.name, value: product.revenueCents, display: formatMoney(product.revenueCents) }))

  const renewsOn = creator.currentPeriodEnd && creator.planCode.toLowerCase() !== 'free' ? creator.currentPeriodEnd : null

  return (
    <div className="dash reveal">
      <article className="card card--feature span-7 hero-rev">
        <div className="card__body stack stack--lg">
          <div className="cluster cluster--between">
            <span className="metric__label">
              <Wallet />
              Total revenue · all time
            </span>
            <Segmented
              label="Period"
              options={RANGES}
              value={heroRange}
              onChange={(value) => onHeroRange(value as DashboardTrendRange)}
            />
          </div>
          <div className="metric metric--xl">
            <span className="metric__value">
              {summary ? <Money amountCents={summary.totalPaidAmountCents} currency={currency} /> : '—'}
            </span>
            <span className="metric__meta">
              {change !== null && <Delta change={change} />}
              <span>{formatMoney(thisMonthCents)} this month</span>
            </span>
          </div>
          {heroTrend?.status === 'success' ? (
            <Sparkline values={heroTrend.data.points.map((point) => point.revenueCents)} label="Revenue trend" />
          ) : heroTrend?.status === 'error' ? (
            <ErrorState compact onRetry={() => onRetryTrend(heroRange)} />
          ) : (
            <SkeletonBlock />
          )}
        </div>
      </article>

      <PlanUsageCard
        slug={slug}
        planName={planName}
        renewsOn={renewsOn}
        products={{ used: summary?.productCount ?? 0, limit: limit('max_products') }}
        pages={{ used: summary?.landingPageCount ?? 0, limit: limit('max_landing_pages') }}
        emails={{ used: summary?.emailsSentThisMonth ?? 0, limit: summary?.emailsMonthlyLimit ?? limit('max_email_sends_per_month') }}
      />

      <div className="span-8">
        <Card
          title="Revenue by month"
          subtitle="Paid orders, last 12 months"
          action={
            <Segmented
              label="Chart"
              options={[
                { value: 'revenue', label: 'Revenue' },
                { value: 'views', label: 'Views' },
              ]}
              value={barsMetric}
              onChange={(value) => onBarsMetric(value as 'revenue' | 'views')}
            />
          }
        >
          {months12 ? (
            <Bars
              values={months12.map((point) => (barsMetric === 'revenue' ? point.revenueCents : point.views))}
              labels={months12.map((point) => month(point.bucketStart))}
              formatValue={barsMetric === 'revenue' ? formatMoney : number}
              label={barsMetric === 'revenue' ? 'Revenue by month' : 'Page views by month'}
            />
          ) : trend12m?.status === 'error' ? (
            <ErrorState compact onRetry={() => onRetryTrend('12m')} />
          ) : (
            <SkeletonBlock />
          )}
        </Card>
      </div>
      <div className="span-4">
        <Card title="Revenue by product" subtitle="Paid orders, all time">
          {byProduct.length > 0 ? (
            <div className="fill-stack">
              <HBars rows={byProduct} />
              <p className="fill-stack__foot">
                <span>{plural(byProduct.length, 'product')} with sales</span>
                <strong>{formatMoney(summary?.totalPaidAmountCents ?? 0)}</strong>
              </p>
            </div>
          ) : (
            <EmptyState compact title="No sales yet" text="Revenue per product shows up after the first order." />
          )}
        </Card>
      </div>

      {summary ? (
        <SalesBoard summary={summary} currency={currency} />
      ) : (
        <div className="span-12">
          <SkeletonCards count={4} />
        </div>
      )}

      <div className="span-8">
        <Card
          title="Latest transactions"
          flush
          action={
            <Button variant="ghost" icon={ArrowRight} to={`/app/${slug}/orders`}>
              View all
            </Button>
          }
        >
          {!summary ? (
            <SkeletonRows count={5} />
          ) : summary.recentOrders.length > 0 ? (
            <OrdersTable orders={summary.recentOrders.slice(0, 5)} compact />
          ) : (
            <EmptyState compact title="No orders yet" text="Your latest sales will show up here." />
          )}
        </Card>
      </div>
      <div className="span-4">
        <TopPagesCard slug={slug} pages={pages} currency={currency} />
      </div>
    </div>
  )
}
