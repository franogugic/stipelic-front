import { Landmark, Percent, Undo2, Wallet } from 'lucide-react'
import type { CSSProperties } from 'react'
import { money, number, percent, plural } from '../../../shared/lib/format'
import { DeltaBadge, KpiCell, Money } from '../../../shared/ui/ledger'
import type { OrderSummary } from '../model/types'

const SEGMENTS: Array<[key: 'paid' | 'pending' | 'failed' | 'refunded', tone: string, label: string]> = [
  ['paid', 'success', 'Paid'],
  ['pending', 'pending', 'Pending'],
  ['failed', 'danger', 'Failed'],
  ['refunded', 'info', 'Refunded'],
]

/** The money board above the orders list: gross, fees, net and refunds with 12-month trends, and orders by status. */
export function OrdersBoard({
  summary,
  currency,
  planName,
  feeBasisPoints,
}: {
  summary: OrderSummary
  currency: string
  /** The workspace's plan, for the fee line; null while the plans load. */
  planName: string | null
  feeBasisPoints: number | null
}) {
  const trend = summary.monthlyTrend
  const thisMonth = trend[trend.length - 1]
  const lastMonth = trend[trend.length - 2]
  const counts = {
    paid: summary.paidOrderCount,
    pending: summary.pendingOrderCount,
    failed: summary.failedOrderCount,
    refunded: summary.refundedOrderCount,
  }
  const total = summary.totalOrderCount
  const share = (count: number) => (total > 0 ? ((count / total) * 100).toFixed(1) : '0.0')
  const netShare = summary.totalPaidAmountCents > 0 ? (summary.netAmountCents / summary.totalPaidAmountCents) * 100 : 0
  const values = (pick: (month: (typeof trend)[number]) => number) => trend.map(pick)

  return (
    <section className="card board" aria-label="Orders overview">
      <div className="board__kpis">
        <KpiCell
          label="Gross revenue"
          icon={Wallet}
          value={<Money amountCents={summary.totalPaidAmountCents} currency={currency} />}
          meta={
            thisMonth && lastMonth ? (
              <>
                <DeltaBadge current={thisMonth.grossCents} previous={lastMonth.grossCents} />
                <span>{money(thisMonth.grossCents, currency)} this month</span>
              </>
            ) : undefined
          }
          spark={trend.length > 1 ? { values: values((month) => month.grossCents), label: 'Gross revenue, last 12 months' } : undefined}
        />
        <KpiCell
          label="Platform fees"
          icon={Percent}
          value={<Money amountCents={summary.totalPlatformFeeCents} currency={currency} />}
          meta={
            feeBasisPoints !== null && planName ? (
              <span>
                {percent(feeBasisPoints / 100)} per sale on {planName}
              </span>
            ) : undefined
          }
          spark={trend.length > 1 ? { values: values((month) => month.feeCents), label: 'Platform fees, last 12 months' } : undefined}
        />
        <KpiCell
          label="Net to you"
          icon={Landmark}
          value={<Money amountCents={summary.netAmountCents} currency={currency} />}
          meta={<span>{percent(netShare)} of gross</span>}
          spark={trend.length > 1 ? { values: values((month) => month.netCents), label: 'Net to you, last 12 months' } : undefined}
        />
        <KpiCell
          label="Refunded"
          icon={Undo2}
          value={number(summary.refundedOrderCount)}
          meta={<span>{money(summary.refundedAmountCents, currency)} returned to buyers</span>}
          spark={trend.length > 1 ? { values: values((month) => month.refundedCount), label: 'Refunded orders, last 12 months' } : undefined}
        />
      </div>
      <div className="board__foot">
        <div className="stackbar">
          <div
            className="stackbar__track"
            role="img"
            aria-label={SEGMENTS.map(([key, , label]) => `${counts[key]} ${label.toLowerCase()}`).join(', ')}
          >
            {SEGMENTS.map(([key, tone]) => (
              <span className={`stackbar__seg stackbar__seg--${tone}`} style={{ '--w': `${share(counts[key])}%` } as CSSProperties} key={key} />
            ))}
          </div>
          <ul className="stackbar__legend" role="list">
            {SEGMENTS.map(([key, tone, label]) => (
              <li key={key}>
                <span className={`stackbar__key stackbar__key--${tone}`} />
                {label} <strong>{number(counts[key])}</strong>
              </li>
            ))}
            <li className="stackbar__total">{plural(total, 'order')} in total</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
