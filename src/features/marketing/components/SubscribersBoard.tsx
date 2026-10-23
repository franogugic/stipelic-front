import { UserCheck, UserPlus, Users, UserX } from 'lucide-react'
import { dateShort, number, percent } from '../../../shared/lib/format'
import { DeltaBadge, KpiCell } from '../../../shared/ui/ledger'
import { PERIODS, inZone, periodPhrase } from '../../analytics/model/series'
import type { ContactPeriodStats } from '../model/types'

/**
 * The summary board above the subscriber list, for one period: everyone now (against the start of the period), the
 * active share, who joined (imports noted) and who left, each against the period before.
 */
export function SubscribersBoard({ stats }: { stats: ContactPeriodStats }) {
  const phrase = periodPhrase(stats.period)
  const compare = PERIODS.find((period) => period.id === stats.period)?.compare
  const previous = stats.previous
  const share = (count: number) => (stats.total > 0 ? (count / stats.total) * 100 : 0)
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
              <span>since {dateShort(inZone(stats.range.from, stats.timezone))}</span>
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
            <span>
              {percent(share(stats.active))} still subscribed · {number(stats.unsubscribed)} left overall
            </span>
          }
          bar={{ ratio: share(stats.active), tone: 'success' }}
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
                  · <strong className="kpi__note">{number(stats.importedInPeriod)} imported</strong>
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
