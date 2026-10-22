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
  Money,
  PageHeader,
  Segmented,
  SkeletonBlock,
  SkeletonCards,
  SkeletonRows,
  Sparkline,
} from '../../../shared/ui/ledger'
import { useAuthStore } from '../../auth/model/auth-store'
import { getAnalyticsSeries } from '../../analytics/api/series-api'
import { PeriodMenu } from '../../analytics/components/PeriodMenu'
import { periodById } from '../../analytics/model/series'
import type { AnalyticsPeriod, AnalyticsSeries } from '../../analytics/model/types'
import { getDashboardTrends, getHomeSummary } from '../../orders/api/orders-api'
import { OrdersTable } from '../../orders/components/OrdersTable'
import type { DashboardTrends, HomeSummary } from '../../orders/model/types'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import type { LandingPage } from '../../landing-pages/model/types'
import { useCreatorStore } from '../model/creator-store'
import { PlanUsageCard } from '../components/dashboard/PlanUsageCard'
import { RevenueByProductCard } from '../components/dashboard/RevenueByProductCard'
import { SalesBoard } from '../components/dashboard/SalesBoard'
import { TopPagesCard } from '../components/dashboard/TopPagesCard'
import type { Creator, CreatorPlan } from '../model/types'

type Load<T> = { status: 'loading' } | { status: 'error' } | { status: 'success'; data: T }

const HERO_DEFAULT_PERIOD: AnalyticsPeriod = '30d'

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
  const [trend12m, setTrend12m] = useState<Load<DashboardTrends>>({ status: 'loading' })
  // The hero card's workspace series, one per period, fetched once each.
  const [heroSeries, setHeroSeries] = useState<Record<string, Load<AnalyticsSeries>>>({})
  const [heroPeriod, setHeroPeriod] = useState<AnalyticsPeriod>(HERO_DEFAULT_PERIOD)
  const [loadedSlug, setLoadedSlug] = useState(slug)
  const [barsMetric, setBarsMetric] = useState<'revenue' | 'views'>('revenue')

  // Another workspace's address starts over (render-time reset, so no stale numbers flash).
  if (loadedSlug !== slug) {
    setLoadedSlug(slug)
    setSummary({ status: 'loading' })
    setTrend12m({ status: 'loading' })
    setHeroSeries({})
    setHeroPeriod(HERO_DEFAULT_PERIOD)
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

  const loadTrend12m = useCallback(async () => {
    setTrend12m({ status: 'loading' })
    try {
      setTrend12m({ status: 'success', data: await getDashboardTrends(slug, '12m') })
    } catch {
      setTrend12m({ status: 'error' })
    }
  }, [slug])

  const loadHero = useCallback(
    (period: AnalyticsPeriod) => {
      const key = `${slug}|${period}`
      getAnalyticsSeries(slug, 'workspace', null, period)
        .then((data) => setHeroSeries((current) => ({ ...current, [key]: { status: 'success', data } })))
        .catch(() => setHeroSeries((current) => ({ ...current, [key]: { status: 'error' } })))
    },
    [slug],
  )

  const heroKey = `${slug}|${heroPeriod}`
  const heroKnown = heroKey in heroSeries
  useEffect(() => {
    if (slug && !heroKnown) loadHero(heroPeriod)
  }, [slug, heroKnown, heroPeriod, loadHero])

  useEffect(() => {
    if (!slug) return
    let active = true
    getHomeSummary(slug)
      .then((data) => active && setSummary({ status: 'success', data }))
      .catch(() => active && setSummary({ status: 'error' }))
    getDashboardTrends(slug, '12m')
      .then((data) => active && setTrend12m({ status: 'success', data }))
      .catch(() => active && setTrend12m({ status: 'error' }))
    void loadPages(slug)
    return () => {
      active = false
    }
  }, [slug, loadPages])

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
              pages={pages}
              trend12m={trend12m}
              hero={heroSeries[heroKey]}
              heroPeriod={heroPeriod}
              onHeroPeriod={setHeroPeriod}
              onRetryHero={() => {
                setHeroSeries((current) => ({ ...current, [heroKey]: { status: 'loading' } }))
                loadHero(heroPeriod)
              }}
              barsMetric={barsMetric}
              onBarsMetric={setBarsMetric}
              onRetryTrend={() => void loadTrend12m()}
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
  pages,
  trend12m,
  hero,
  heroPeriod,
  onHeroPeriod,
  onRetryHero,
  barsMetric,
  onBarsMetric,
  onRetryTrend,
}: {
  creator: Creator
  plan: CreatorPlan | undefined
  summary: HomeSummary | null
  pages: LandingPage[]
  trend12m: Load<DashboardTrends>
  hero: Load<AnalyticsSeries> | undefined
  heroPeriod: AnalyticsPeriod
  onHeroPeriod: (period: AnalyticsPeriod) => void
  onRetryHero: () => void
  barsMetric: 'revenue' | 'views'
  onBarsMetric: (metric: 'revenue' | 'views') => void
  onRetryTrend: () => void
}) {
  const slug = creator.slug
  const currency = summary?.currency ?? creator.defaultCurrency ?? 'EUR'
  const formatMoney = (cents: number) => money(cents, currency)
  const planName = creator.planName
  const limit = (key: string) => plan?.limits[key]

  const months12 = trend12m.status === 'success' ? trend12m.data.points : null

  // The hero: revenue in the chosen period, against the period before.
  const heroData = hero?.status === 'success' ? hero.data : null
  const heroPeriodDef = periodById(heroPeriod, HERO_DEFAULT_PERIOD)
  const heroPrevious = heroData?.previousTotals ?? null
  const heroChange =
    heroData && heroPrevious && heroPrevious.revenueCents > 0
      ? ((heroData.totals.revenueCents - heroPrevious.revenueCents) / heroPrevious.revenueCents) * 100
      : null

  const renewsOn = creator.currentPeriodEnd && creator.planCode.toLowerCase() !== 'free' ? creator.currentPeriodEnd : null

  return (
    <div className="dash reveal">
      <article className="card card--feature span-7 hero-rev">
        <div className="card__body stack stack--lg">
          <div className="cluster cluster--between">
            <span className="metric__label">
              <Wallet />
              Revenue · {heroPeriodDef.label.toLowerCase()}
            </span>
            <PeriodMenu period={heroPeriod} onPeriod={onHeroPeriod} align="end" />
          </div>
          <div className="metric metric--xl">
            <span className="metric__value">
              {heroData ? <Money amountCents={heroData.totals.revenueCents} currency={currency} /> : '—'}
            </span>
            <span className="metric__meta">
              {heroData && heroPrevious ? (
                <>
                  {heroChange !== null && <Delta change={heroChange} />}
                  <span>vs {formatMoney(heroPrevious.revenueCents)} {heroPeriodDef.compare}</span>
                </>
              ) : heroData ? (
                <span>{plural(heroData.totals.sales, 'sale')} since {date(heroData.since)}</span>
              ) : null}
            </span>
          </div>
          {heroData ? (
            <Sparkline values={heroData.buckets.map((bucket) => bucket.revenueCents)} label={`Revenue, ${heroPeriodDef.label.toLowerCase()}`} />
          ) : hero?.status === 'error' ? (
            <ErrorState compact onRetry={onRetryHero} />
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
          ) : trend12m.status === 'error' ? (
            <ErrorState compact onRetry={onRetryTrend} />
          ) : (
            <SkeletonBlock />
          )}
        </Card>
      </div>
      <div className="span-4">
        <RevenueByProductCard slug={slug} currency={currency} />
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
