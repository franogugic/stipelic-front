import { UserCheck, UserPlus, Users, UserX } from 'lucide-react'
import { date, dateShort, number } from '../../../shared/lib/format'
import { DeltaBadge, KpiCell } from '../../../shared/ui/ledger'
import { PERIODS, inZone, periodPhrase } from '../../analytics/model/series'
import type { ContactPeriodStats } from '../model/types'

/**
 * The summary board above the subscriber list, for one period: everyone now (against the start of the period), the
 * active share, who joined (imports noted) and who left, each against the period before.
 */
export function SubscribersBoard({
  stats,
  plan,
}: {
  stats: ContactPeriodStats
  /** The plan's name and its limit of active contacts (null: no limit). */
  plan: { name: string; contactLimit: number | null }
}) {
  const phrase = periodPhrase(stats.period)
  const compare = PERIODS.find((period) => period.id === stats.period)?.compare
  const previous = stats.previous
  const spark = (label: string, values: number[]) => (values.length > 1 ? { values, label: `${label}, ${phrase}` } : undefined)
  const startLabel =
    stats.period === 'today' ? 'at midnight' : `on ${dateShort(inZone(stats.range.from, stats.timezone))}`

  return (
    <section className="card board" aria-label={`Subscribers overview, ${phrase}`}>
      <div className="board__kpis">
        <KpiCell
          label="Subscribers"
          icon={Users}
          value={number(stats.total)}
          meta={
            stats.period === 'all' ? (
              <span>since {date(inZone(stats.range.from, stats.timezone))}</span>
            ) : (
              <>
                <DeltaBadge current={stats.total} previous={stats.startTotal} />
                <span>
                  vs {number(stats.startTotal)} {startLabel}
                </span>
              </>
            )
          }
          spark={spark('Subscribers', stats.buckets.map((bucket) => bucket.total))}
        />
        <KpiCell
          label="Active"
          icon={UserCheck}
          value={number(stats.active)}
          meta={
            plan.contactLimit === null ? (
              <span>No contact limit on {plan.name}</span>
            ) : (
              <span>
                of {number(plan.contactLimit)} on {plan.name} · {number(stats.unsubscribed)} unsubscribed don’t count
              </span>
            )
          }
          bar={
            plan.contactLimit === null
              ? undefined
              : { ratio: (stats.active / plan.contactLimit) * 100, tone: stats.active / plan.contactLimit >= 0.85 ? 'warning' : 'success' }
          }
        />
        <KpiCell
          label="New"
          icon={UserPlus}
          value={number(stats.joined)}
          meta={
            <>
              {previous ? (
                <>
                  <DeltaBadge current={stats.joined} previous={previous.joined} />
                  <span>
                    vs {number(previous.joined)} {compare}
                  </span>
                </>
              ) : (
                <span>{phrase}</span>
              )}
              {stats.importedInPeriod > 0 && (
                <span>
                  {' '}
                  · <strong className="kpi__note">incl. {number(stats.importedInPeriod)} imported</strong>
                </span>
              )}
            </>
          }
          spark={spark('New subscribers', stats.buckets.map((bucket) => bucket.joined))}
        />
        <KpiCell
          label="Unsubscribed"
          icon={UserX}
          value={number(stats.unsubscribedInPeriod)}
          meta={<span>{previous ? `vs ${number(previous.unsubscribed)} ${compare}` : phrase}</span>}
          spark={spark('Unsubscribes', stats.buckets.map((bucket) => bucket.unsubscribed))}
        />
      </div>
    </section>
  )
}
