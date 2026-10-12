import { Calendar, Crown, Landmark, Receipt } from 'lucide-react'
import { money, number, percent, plural } from '../../../../shared/lib/format'
import { DeltaBadge, KpiCell, Money } from '../../../../shared/ui/ledger'
import type { HomeSummary } from '../../../orders/model/types'

/** "Sales at a glance": best seller, average order, this month and fees, with paid orders, customers, refunds and net. */
export function SalesBoard({ summary, currency, feePercent }: { summary: HomeSummary; currency: string; feePercent: number | null }) {
  const revenue = summary.monthlyRevenueTrend
  const counts = summary.monthlyPaidOrderCounts
  const thisMonth = revenue[revenue.length - 1] ?? summary.thisMonthRevenueCents
  const lastMonth = revenue[revenue.length - 2] ?? 0
  const average = (index: number) => {
    const count = counts[index] ?? 0
    return count > 0 ? (revenue[index] ?? 0) / count : 0
  }
  const avgThis = average(revenue.length - 1)
  const avgLast = average(revenue.length - 2)
  const total = summary.totalPaidAmountCents
  const top = summary.topProduct
  const net = summary.totalPaidAmountCents - summary.totalPlatformFeeCents

  return (
    <section className="card board span-12" aria-label="Sales at a glance">
      <div className="board__kpis">
        <KpiCell
          label="Best seller"
          icon={Crown}
          value={<span className="kpi__name">{top?.name ?? '—'}</span>}
          meta={top ? <span>{money(top.totalCents, currency)} · {percent(total > 0 ? (top.totalCents / total) * 100 : 0)} of revenue</span> : <span>No sales yet</span>}
        />
        <KpiCell
          label="Average order"
          icon={Receipt}
          value={summary.paidOrderCount > 0 ? <Money amountCents={Math.round(total / summary.paidOrderCount)} currency={currency} /> : '—'}
          meta={
            <>
              <DeltaBadge current={avgThis} previous={avgLast} />
              <span>{money(Math.round(avgThis), currency)} this month</span>
            </>
          }
        />
        <KpiCell
          label="This month"
          icon={Calendar}
          value={<Money amountCents={thisMonth} currency={currency} />}
          meta={
            <>
              <DeltaBadge current={thisMonth} previous={lastMonth} />
              <span>vs {money(lastMonth, currency)} last month</span>
            </>
          }
        />
        <KpiCell
          label="Fees paid to platform"
          icon={Landmark}
          value={<Money amountCents={summary.totalPlatformFeeCents} currency={currency} />}
          meta={<span>{feePercent === null ? 'Per sale' : `${percent(feePercent)} per sale`} · all time</span>}
        />
      </div>
      <dl className="board__stats">
        <div className="board__stat">
          <dt>Paid orders</dt>
          <dd>{number(summary.paidOrderCount)}</dd>
        </div>
        <div className="board__stat">
          <dt>Customers</dt>
          <dd>{number(summary.customerCount)}</dd>
        </div>
        <div className="board__stat">
          <dt>Refunded</dt>
          <dd>
            {plural(summary.refundedOrderCount, 'order')} · {money(summary.refundedAmountCents, currency)}
          </dd>
        </div>
        <div className="board__stat">
          <dt>Net to you</dt>
          <dd>{money(net, currency)}</dd>
        </div>
      </dl>
    </section>
  )
}
