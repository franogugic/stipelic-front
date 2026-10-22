import { Landmark, Receipt, Undo2, Wallet } from 'lucide-react'
import type { CSSProperties } from 'react'
import { money, number, plural } from '../../../shared/lib/format'
import { KpiCell, Money } from '../../../shared/ui/ledger'
import { periodPhrase } from '../../analytics/model/series'
import type { OrderPeriodSummary } from '../model/types'

const SEGMENTS: Array<[key: 'paid' | 'pending' | 'failed' | 'refunded', tone: string, label: string]> = [
  ['paid', 'success', 'Paid'],
  ['pending', 'pending', 'Pending'],
  ['failed', 'danger', 'Failed'],
  ['refunded', 'info', 'Refunded'],
]

/** The money board above the orders list: gross, net, a spare tile and refunds for one period, each with the
 * period's chart buckets, and the period's orders by status. */
export function OrdersBoard({ summary, currency }: { summary: OrderPeriodSummary; currency: string }) {
  const trend = summary.buckets
  const phrase = periodPhrase(summary.period)
  const counts = {
    paid: summary.paidOrderCount,
    pending: summary.pendingOrderCount,
    failed: summary.failedOrderCount,
    refunded: summary.refundedOrderCount,
  }
  const total = summary.totalOrderCount
  const share = (count: number) => (total > 0 ? ((count / total) * 100).toFixed(1) : '0.0')
  const values = (pick: (month: (typeof trend)[number]) => number) => trend.map(pick)

  return (
    <section className="card board" aria-label="Orders overview">
      <div className="board__kpis">
        <KpiCell
          label="Gross revenue"
          icon={Wallet}
          value={<Money amountCents={summary.totalPaidAmountCents} currency={currency} />}
          meta={<span>{plural(summary.paidOrderCount, 'paid order')}</span>}
          spark={trend.length > 1 ? { values: values((month) => month.grossCents), label: `Gross revenue, ${phrase}` } : undefined}
        />
        <KpiCell
          label="Net to you"
          icon={Landmark}
          value={<Money amountCents={summary.netAmountCents} currency={currency} />}
          meta={<span>To replace</span>}
          spark={trend.length > 1 ? { values: values((month) => month.netCents), label: `Net to you, ${phrase}` } : undefined}
        />
        <KpiCell label="To replace" icon={Receipt} value="—" />
        <KpiCell
          label="Refunded"
          icon={Undo2}
          value={number(summary.refundedOrderCount)}
          meta={<span>{money(summary.refundedAmountCents, currency)} returned to buyers</span>}
          spark={trend.length > 1 ? { values: values((month) => month.refundedCount), label: `Refunded orders, ${phrase}` } : undefined}
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
