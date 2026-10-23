import { UserPlus } from 'lucide-react'
import { number, plural } from '../../../shared/lib/format'
import { Card, HBars } from '../../../shared/ui/ledger'
import { QuietPeriod } from '../../analytics/components/QuietPeriod'
import { periodPhrase } from '../../analytics/model/series'
import type { ContactPeriodStats } from '../model/types'

/** "Where they joined": the people who joined in the period, each at the source of their first capture (or the import). */
export function JoinedCard({ stats, onShowAll }: { stats: ContactPeriodStats; onShowAll: () => void }) {
  const phrase = periodPhrase(stats.period)
  return (
    <Card title="Where they joined" subtitle={`New subscribers · ${phrase}`}>
      {stats.sources.length > 0 ? (
        <div className="fill-stack">
          <HBars rows={stats.sources.map((source) => ({ label: source.title, value: source.count, display: number(source.count) }))} />
          <p className="fill-stack__foot">
            <span>{plural(stats.sources.length, 'source')}</span>
            <strong>{plural(stats.joined, 'person', 'people')} joined</strong>
          </p>
        </div>
      ) : (
        <QuietPeriod
          period={stats.period}
          icon={UserPlus}
          title="Nobody joined in this period"
          text={`No new subscribers ${stats.period === 'today' ? 'today' : stats.period === 'all' ? 'so far' : `in the ${phrase}`}.`}
          onShowAll={onShowAll}
        />
      )}
    </Card>
  )
}
