import { Package, Plus } from 'lucide-react'
import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { date } from '../../../shared/lib/format'
import { useKeyedLoad } from '../../../shared/lib/use-keyed-load'
import { AppShell } from '../../../shared/ui/AppShell'
import { Button, EmptyState, ErrorState, PageHeader, SkeletonBlock, SkeletonCards } from '../../../shared/ui/ledger'
import { useAuthStore } from '../../auth/model/auth-store'
import { getAnalyticsPages, getAnalyticsSeries, getProductRevenue } from '../../analytics/api/series-api'
import { PageControls } from '../../analytics/components/PageControls'
import { scopeProducts } from '../../analytics/model/series'
import type { AnalyticsMetric } from '../../analytics/model/types'
import { usePagePeriod } from '../../analytics/model/use-page-period'
import { listLandingPages } from '../../landing-pages/api/landing-pages-api'
import { getHomeSummary, listOrders } from '../../orders/api/orders-api'
import { listProducts, getProductSignups } from '../../products/api/products-api'
import { isFreeProduct } from '../../products/model/product-file'
import { DashboardChart } from '../components/dashboard/DashboardChart'
import { DashboardHero } from '../components/dashboard/DashboardHero'
import { GlanceBoard } from '../components/dashboard/GlanceBoard'
import { LatestSignupsCard, LatestTransactionsCard } from '../components/dashboard/LatestCard'
import { PlanUsageCard } from '../components/dashboard/PlanUsageCard'
import { FunnelCard, ProductRevenueCard } from '../components/dashboard/ScopeSideCard'
import { TopPagesCard } from '../components/dashboard/TopPagesCard'
import { useCreatorStore } from '../model/creator-store'

const SOLD_METRICS: AnalyticsMetric[] = ['revenue', 'sales', 'views']
const FREE_METRICS: AnalyticsMetric[] = ['emails', 'downloads', 'views']

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

  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  // One period for the whole page, and the product it is narrowed to — in the URL only: the dashboard always opens on
  // "All products" unless the link says otherwise.
  const { period, setPeriod, params, update } = usePagePeriod('dashboard')
  const productParam = params.get('product')

  const ready = slug !== ''
  const products = useKeyedLoad(ready ? `products|${slug}` : null, () => listProducts(slug, true))
  const allProducts = products.load.status === 'success' ? products.load.data : []
  const scoped = productParam ? (scopeProducts(allProducts).find((product) => product.publicId === productParam) ?? null) : null
  const scopeId = scoped?.publicId ?? null
  const free = scoped ? isFreeProduct(scoped) : false
  // A product in the link is checked against the list first, so an unknown one never reaches the API.
  const dataReady = ready && (productParam === null || products.load.status !== 'loading')
  const dataKey = dataReady ? `${slug}|${period.id}|${scopeId ?? 'all'}` : null
  const scopeKey = dataReady ? `${slug}|${scopeId ?? 'all'}` : null

  const series = useKeyedLoad(dataKey, () => getAnalyticsSeries(slug, scopeId ? 'product' : 'workspace', scopeId, period.id))
  const breakdown = useKeyedLoad(dataKey && !free ? dataKey : null, () => getProductRevenue(slug, period.id, scopeId))
  const topPages = useKeyedLoad(dataKey, () => getAnalyticsPages(slug, period.id, scopeId, 5))
  const latestOrders = useKeyedLoad(scopeKey && !free ? `${scopeKey}|orders` : null, () =>
    listOrders(slug, { productId: scopeId ?? undefined, limit: 5 }),
  )
  const latestSignups = useKeyedLoad(scopeKey && free ? `${scopeKey}|signups` : null, () => getProductSignups(slug, scopeId ?? '', 5))
  const pages = useKeyedLoad(ready ? `pages|${slug}` : null, () => listLandingPages(slug, true))
  const usage = useKeyedLoad(ready ? `usage|${slug}` : null, () => getHomeSummary(slug))

  if (!slug) return null

  const metrics = free ? FREE_METRICS : SOLD_METRICS
  const requested = params.get('metric') as AnalyticsMetric | null
  const metric = requested && metrics.includes(requested) ? requested : metrics[0]
  const showAllTime = () => setPeriod('all')

  const productPages = scoped && pages.load.status === 'success' ? pages.load.data.filter((page) => page.productPublicId === scoped.publicId) : []
  const livePages = productPages.filter((page) => page.status !== 'Archived')
  const pageCount = free
    ? livePages.filter((page) => page.type === 'LeadGen').length
    : livePages.filter((page) => page.type === 'Sales' && page.status === 'Published').length

  const currency = (series.load.status === 'success' ? series.load.data.currency : (creator?.defaultCurrency ?? 'EUR')) ?? 'EUR'
  const plan = creator ? creatorPlans.find((candidate) => candidate.code === creator.planCode) : undefined
  const limit = (key: string) => plan?.limits[key]
  const usageData = usage.load.status === 'success' ? usage.load.data : null
  const renewsOn = creator?.currentPeriodEnd && creator.planCode.toLowerCase() !== 'free' ? creator.currentPeriodEnd : null

  const usageCard = creator ? (
    <PlanUsageCard
      slug={slug}
      planName={creator.planName}
      renewsOn={renewsOn}
      products={{ used: usageData?.productCount ?? 0, limit: limit('max_products') }}
      pages={{ used: usageData?.landingPageCount ?? 0, limit: limit('max_landing_pages') }}
      emails={{ used: usageData?.emailsSentThisMonth ?? 0, limit: usageData?.emailsMonthlyLimit ?? limit('max_email_sends_per_month') }}
    />
  ) : null

  const controls = (
    <PageControls
      period={period.id}
      onPeriod={setPeriod}
      series={series.load.status === 'success' ? series.load.data : null}
      loading={series.load.status === 'loading'}
      updatedAt={series.load.status === 'success' ? series.load.at : new Date()}
      sinceNote={scoped ? 'since you added it' : 'since you started'}
      scope={{
        products: allProducts,
        selectedId: scopeId,
        onSelect: (id) => update({ product: id, metric: null }),
      }}
    />
  )

  const body = () => {
    if (series.load.status === 'error') {
      return (
        <div className="dash">
          <section className="card span-7">
            <ErrorState
              compact
              title="We couldn’t load your numbers"
              text="The figures for this period didn’t load. Your pages and sales aren’t affected — try again in a moment."
              onRetry={series.reload}
            />
          </section>
          {usageCard}
        </div>
      )
    }
    if (series.load.status === 'loading') {
      return (
        <div className="dash" aria-busy="true">
          <span className="sr-only" role="status">
            Loading {period.label.toLowerCase()}…
          </span>
          <div className="card span-7">
            <div className="card__body stack stack--md">
              <SkeletonBlock />
            </div>
          </div>
          {usageCard}
          <div className="span-8">
            <SkeletonBlock />
          </div>
          <div className="span-4">
            <SkeletonBlock />
          </div>
          <div className="span-12">
            <SkeletonCards count={4} />
          </div>
        </div>
      )
    }

    const data = series.load.data
    return (
      <div className="dash reveal">
        <DashboardHero series={data} free={free} />
        {usageCard}
        <div className="span-8">
          <DashboardChart
            series={data}
            metrics={metrics}
            metric={metric}
            onMetric={(next) => update({ metric: next === metrics[0] ? null : next })}
            scopeName={scoped?.name ?? null}
            onShowAll={showAllTime}
          />
        </div>
        <div className="span-4">
          {free ? (
            <FunnelCard series={data} onShowAll={showAllTime} />
          ) : (
            <ProductRevenueCard load={breakdown.load} currency={currency} onRetry={breakdown.reload} onShowAll={showAllTime} />
          )}
        </div>
        <GlanceBoard
          kind={scoped ? (free ? 'free' : 'sold') : 'all'}
          series={data}
          breakdown={breakdown.load}
          productName={scoped?.name ?? null}
          pageCount={pageCount}
        />
        <div className="span-8">
          {free ? (
            <LatestSignupsCard slug={slug} load={latestSignups.load} onRetry={latestSignups.reload} />
          ) : (
            <LatestTransactionsCard slug={slug} productId={scopeId} load={latestOrders.load} onRetry={latestOrders.reload} />
          )}
        </div>
        <div className="span-4">
          <TopPagesCard
            slug={slug}
            period={period.id}
            load={topPages.load}
            scope={scoped ? { free } : null}
            hasArchivedPages={productPages.length > 0 && livePages.length === 0}
            onRetry={topPages.reload}
            onShowAll={showAllTime}
          />
        </div>
      </div>
    )
  }

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
            subtitle={
              scoped ? (
                <>
                  Showing <strong>{scoped.name}</strong> only.{' '}
                  <button className="link link--button" type="button" onClick={() => update({ product: null, metric: null })}>
                    Show all products
                  </button>
                </>
              ) : (
                `Here is how ${creator.name} is doing.`
              )
            }
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
          <div className="stack stack--lg">
            {controls}
            {body()}
          </div>
        </>
      )}
    </AppShell>
  )
}
