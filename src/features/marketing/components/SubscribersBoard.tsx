import { UserCheck, UserPlus, Users, UserX } from 'lucide-react'
import { number, percent } from '../../../shared/lib/format'
import { DeltaBadge, KpiCell } from '../../../shared/ui/ledger'
import type { ContactStats } from '../model/types'

/** The summary board above the subscriber list: everyone, active, new this month and unsubscribed. */
export function SubscribersBoard({ stats }: { stats: ContactStats }) {
  const totals = stats.growth.map((point) => point.total)
  const joined = stats.monthly.map((month) => month.joined)
  const left = stats.monthly.map((month) => month.unsubscribed)
  const share = (count: number) => (stats.total > 0 ? (count / stats.total) * 100 : 0)
  const last = (values: number[], back = 0) => values[values.length - 1 - back] ?? 0

  return (
    <section className="card board" aria-label="Subscribers overview">
      <div className="board__kpis">
        <KpiCell
          label="Subscribers"
          icon={Users}
          value={number(stats.total)}
          meta={
            <>
              <DeltaBadge current={last(totals)} previous={last(totals, 1)} />
              <span>vs end of last month</span>
            </>
          }
          spark={totals.length > 1 ? { values: totals, label: 'Subscribers, last 12 months' } : undefined}
        />
        <KpiCell
          label="Active"
          icon={UserCheck}
          value={number(stats.active)}
          meta={<span>{percent(share(stats.active))} still subscribed</span>}
          bar={{ ratio: share(stats.active), tone: 'success' }}
        />
        <KpiCell
          label="New this month"
          icon={UserPlus}
          value={number(stats.newThisMonth)}
          meta={
            <>
              <DeltaBadge current={stats.newThisMonth} previous={last(joined, 1)} />
              <span>vs {number(last(joined, 1))} last month</span>
            </>
          }
          spark={joined.length > 1 ? { values: joined, label: 'New subscribers per month' } : undefined}
        />
        <KpiCell
          label="Unsubscribed"
          icon={UserX}
          value={number(stats.unsubscribed)}
          meta={
            <span>
              {percent(share(stats.unsubscribed))} of everyone · {number(last(left))} this month
            </span>
          }
          spark={left.length > 1 ? { values: left, label: 'Unsubscribes per month' } : undefined}
        />
      </div>
    </section>
  )
}
