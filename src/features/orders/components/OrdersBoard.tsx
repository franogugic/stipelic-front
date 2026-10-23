import { Receipt, ShoppingBag, Undo2, Wallet } from 'lucide-react'
import type { CSSProperties } from 'react'
import { money, number, plural } from '../../../shared/lib/format'
import { DeltaBadge, KpiCell, Money } from '../../../shared/ui/ledger'
import { PERIODS, periodPhrase } from '../../analytics/model/series'
import type { OrderPeriodSummary } from '../model/types'

const SEGMENTS: Array<[key: 'paid' | 'pending' | 'failed' | 'refunded', tone: string, label: string]> = [
  ['paid', 'success', 'Paid'],
  ['pending', 'pending', 'Pending'],
  ['failed', 'danger', 'Failed'],
  ['refunded', 'info', 'Refunded'],
]

const average = (revenueCents: number, paid: number) => (paid ? revenueCents / paid : 0)

/**
 * The money board above the orders list: revenue, paid orders, average order and refunds of one period (and product),
 * each with its trend over the period's buckets and the change against the period before, and the period's orders
 * by status. Every count follows the one date rule, so the list below adds up to it.
 */
export function OrdersBoard({ summary, currency }: { summary: OrderPeriodSummary; currency: string }) {
  const trend = summary.buckets
  const phrase = periodPhrase(summary.period)
  const compare = PERIODS.find((period) => period.id === summary.period)?.compare
  const previous = summary.previous
  const counts = {
    paid: summary.paidOrderCount,
    pending: summary.pendingOrderCount,
    failed: summary.failedOrderCount,
    refunded: summary.refundedOrderCount,
  }
  const total = summary.totalOrderCount
  const share = (count: number) => (total > 0 ? ((count / total) * 100).toFixed(1) : '0.0')
  const spark = (label: string, values: number[]) => (values.length > 1 ? { values, label: `${label}, ${phrase}` } : undefined)
  const averageNow = average(summary.totalPaidAmountCents, summary.paidOrderCount)
  const averageBefore = previous ? average(previous.totalPaidAmountCents, previous.paidOrderCount) : 0

  return (
    <section className="card board" aria-label={`Orders overview, ${phrase}`}>
      <div className="board__kpis">
        <KpiCell
          label="Revenue"
          icon={Wallet}
          value={<Money amountCents={summary.totalPaidAmountCents} currency={currency} />}
          meta={
            previous ? (
              <>
                <DeltaBadge current={summary.totalPaidAmountCents} previous={previous.totalPaidAmountCents} />
                <span>
                  vs {money(previous.totalPaidAmountCents, currency)} {compare}
                </span>
              </>
            ) : (
              <span>all time</span>
            )
          }
          spark={spark('Revenue', trend.map((bucket) => bucket.grossCents))}
        />
        <KpiCell
          label="Paid orders"
          icon={ShoppingBag}
          value={number(summary.paidOrderCount)}
          meta={
            previous ? (
              <>
                <DeltaBadge current={summary.paidOrderCount} previous={previous.paidOrderCount} />
                <span>
                  vs {number(previous.paidOrderCount)} {compare}
                </span>
              </>
            ) : (
              <span>all time</span>
            )
          }
          spark={spark('Paid orders', trend.map((bucket) => bucket.paidCount))}
        />
        <KpiCell
          label="Average order"
          icon={Receipt}
          value={<Money amountCents={Math.round(averageNow)} currency={currency} />}
          meta={
            previous ? (
              <>
                <DeltaBadge current={averageNow} previous={averageBefore} />
                <span>
                  vs {money(Math.round(averageBefore), currency)} {compare}
                </span>
              </>
            ) : (
              <span>all time</span>
            )
          }
          spark={spark('Average order', trend.map((bucket) => average(bucket.grossCents, bucket.paidCount)))}
        />
        <KpiCell
          label="Refunded"
          icon={Undo2}
          value={number(summary.refundedOrderCount)}
          meta={<span>{summary.refundedOrderCount > 0 ? `${money(summary.refundedAmountCents, currency)} returned to buyers` : 'No refunds'}</span>}
          spark={spark('Refunded orders', trend.map((bucket) => bucket.refundedCount))}
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
            <li className="stackbar__total">
              {plural(total, 'order')} · {phrase}
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
