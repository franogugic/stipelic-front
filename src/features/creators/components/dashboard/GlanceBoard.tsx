import { Crown, Download, MailPlus, Percent, Receipt, ShoppingBag, Undo2, UserCheck, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { money, number, percent, plural } from '../../../../shared/lib/format'
import type { Load } from '../../../../shared/lib/use-keyed-load'
import { DeltaBadge, KpiCell, Money, SkeletonCards } from '../../../../shared/ui/ledger'
import { Versus } from '../../../analytics/components/Versus'
import { PERIODS, periodPhrase } from '../../../analytics/model/series'
import type { AnalyticsSeries, ProductRevenueBreakdown } from '../../../analytics/model/types'

const rate = (part: number, whole: number) => percent(whole ? (part / whole) * 100 : 0)

function Stats({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="board__stats">
      {items.map(([label, value]) => (
        <div className="board__stat" key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Customers with the change, and how many came back: from the series extras. */
function customersMeta(series: AnalyticsSeries): ReactNode {
  const extras = series.extras
  if (!extras) return null
  const compare = PERIODS.find((period) => period.id === series.period)?.compare
  return (
    <>
      {extras.previousCustomers !== null ? (
        <>
          <DeltaBadge current={extras.customers} previous={extras.previousCustomers} />
          <span>
            vs {extras.previousCustomers} {compare}
          </span>
        </>
      ) : (
        <span>all time</span>
      )}
      {extras.returningCustomers > 0 && <span> · {extras.returningCustomers} returning</span>}
    </>
  )
}

const refundNote = (series: AnalyticsSeries) =>
  series.extras && series.extras.refundCount > 0
    ? `${plural(series.extras.refundCount, 'order')} · ${money(series.extras.refundedCents, series.currency)}`
    : 'None'

/** The glance board of a free product: sign-ups, downloads, how the lead page converts and how many stayed. */
function FreeBoard({ series, leadPages }: { series: AnalyticsSeries; leadPages: number }) {
  const { totals, extras } = series
  const joined = extras?.signups ?? 0
  const still = extras?.signupsStillSubscribed ?? 0
  return (
    <section className="card board span-12" aria-label={`Sign-ups at a glance, ${periodPhrase(series.period)}`}>
      <div className="board__kpis">
        <KpiCell label="Sign-ups" icon={MailPlus} value={number(totals.emails)} meta={<Versus series={series} metric="emails" />} />
        <KpiCell label="Downloads" icon={Download} value={number(totals.downloads)} meta={<Versus series={series} metric="downloads" />} />
        <KpiCell
          label="Sign-up rate"
          icon={Percent}
          value={rate(totals.emails, totals.views)}
          meta={<span>of {plural(totals.views, 'page view')}</span>}
        />
        <KpiCell
          label="Still subscribed"
          icon={UserCheck}
          value={joined ? rate(still, joined) : '—'}
          meta={
            <span>
              {number(still)} of {number(joined)} who signed up
            </span>
          }
        />
      </div>
      <Stats
        items={[
          ['Page views', number(totals.views)],
          ['Downloads per sign-up', totals.emails ? (totals.downloads / totals.emails).toFixed(1) : '—'],
          ['Unsubscribed since', number(joined - still)],
          ['Lead pages', number(leadPages)],
        ]}
      />
    </section>
  )
}

/** The glance board of one product that sells. */
function SoldBoard({ series, name, salesPages }: { series: AnalyticsSeries; name: string; salesPages: number }) {
  const { totals, extras } = series
  return (
    <section className="card board span-12" aria-label={`Sales of ${name}, ${periodPhrase(series.period)}`}>
      <div className="board__kpis">
        <KpiCell label="Paid orders" icon={Receipt} value={number(totals.sales)} meta={<Versus series={series} metric="sales" />} />
        <KpiCell label="Customers" icon={Users} value={number(extras?.customers ?? 0)} meta={customersMeta(series)} />
        <KpiCell
          label="Visitors who bought"
          icon={Percent}
          value={rate(totals.sales, totals.views)}
          meta={<span>of {plural(totals.views, 'page view')}</span>}
        />
        <KpiCell
          label="Refunded"
          icon={Undo2}
          value={number(extras?.refundCount ?? 0)}
          meta={<span>{extras && extras.refundCount > 0 ? `${money(extras.refundedCents, series.currency)} returned` : 'No refunds'}</span>}
        />
      </div>
      <Stats
        items={[
          ['Page views', number(totals.views)],
          ['Revenue per view', money(totals.views ? Math.round(totals.revenueCents / totals.views) : 0, series.currency)],
          ['Average order', money(totals.sales ? Math.round(totals.revenueCents / totals.sales) : 0, series.currency)],
          ['Pages that sell it', number(salesPages)],
        ]}
      />
    </section>
  )
}

/** The glance board of the whole workspace: best seller, orders, average order, customers. */
function AllBoard({ series, breakdown }: { series: AnalyticsSeries; breakdown: ProductRevenueBreakdown }) {
  const { totals, previousTotals } = series
  const currency = series.currency
  const best = breakdown.products[0]
  const average = (sales: number, revenueCents: number) => (sales ? revenueCents / sales : 0)
  const compare = PERIODS.find((period) => period.id === series.period)?.compare
  return (
    <section className="card board span-12" aria-label={`Sales at a glance, ${periodPhrase(series.period)}`}>
      <div className="board__kpis">
        <KpiCell
          label="Best seller"
          icon={Crown}
          value={<span className="kpi__name">{best?.name ?? '—'}</span>}
          meta={
            <span>
              {best ? `${money(best.revenueCents, currency)} · ${rate(best.revenueCents, breakdown.totalRevenueCents)} of revenue` : 'No sales in this period'}
            </span>
          }
        />
        <KpiCell label="Paid orders" icon={ShoppingBag} value={number(totals.sales)} meta={<Versus series={series} metric="sales" />} />
        <KpiCell
          label="Average order"
          icon={Receipt}
          value={<Money amountCents={Math.round(average(totals.sales, totals.revenueCents))} currency={currency} />}
          meta={
            previousTotals ? (
              <>
                <DeltaBadge
                  current={average(totals.sales, totals.revenueCents)}
                  previous={average(previousTotals.sales, previousTotals.revenueCents)}
                />
                <span>
                  vs {money(Math.round(average(previousTotals.sales, previousTotals.revenueCents)), currency)} {compare}
                </span>
              </>
            ) : (
              <span>all time</span>
            )
          }
        />
        <KpiCell label="Customers" icon={Users} value={number(series.extras?.customers ?? 0)} meta={customersMeta(series)} />
      </div>
      <Stats
        items={[
          ['Visitors who bought', rate(totals.sales, totals.views)],
          ['Revenue per view', money(totals.views ? Math.round(totals.revenueCents / totals.views) : 0, currency)],
          ['Refunded', refundNote(series)],
          ['Page views', number(totals.views)],
        ]}
      />
    </section>
  )
}

const NO_BREAKDOWN = (series: AnalyticsSeries): ProductRevenueBreakdown => ({
  period: series.period,
  range: series.range,
  currency: series.currency,
  totalRevenueCents: 0,
  products: [],
  otherRevenueCents: 0,
  productsWithSales: 0,
  selected: null,
})

/**
 * "At a glance" for the three scopes of the dashboard. The all-products board also needs the revenue by product
 * (its best seller), so it waits for both.
 */
export function GlanceBoard({
  kind,
  series,
  breakdown,
  productName,
  pageCount,
}: {
  kind: 'all' | 'sold' | 'free'
  series: AnalyticsSeries
  breakdown: Load<ProductRevenueBreakdown>
  productName: string | null
  /** Sold: published sales pages of the product; free: its lead pages. */
  pageCount: number
}) {
  if (kind === 'free') return <FreeBoard series={series} leadPages={pageCount} />
  if (kind === 'sold') return <SoldBoard series={series} name={productName ?? 'this product'} salesPages={pageCount} />
  if (breakdown.status === 'success') return <AllBoard series={series} breakdown={breakdown.data} />
  // The best seller is the only cell that needs it: without the breakdown it stays empty rather than hiding the board.
  if (breakdown.status === 'error') return <AllBoard series={series} breakdown={NO_BREAKDOWN(series)} />
  return (
    <div className="span-12">
      <SkeletonCards count={4} />
    </div>
  )
}
