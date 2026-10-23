import { number, plural } from '../../../shared/lib/format'
import { AreaChart, Card, ChartLegend } from '../../../shared/ui/ledger'
import { bucketLabels, inZone, periodPhrase } from '../../analytics/model/series'
import type { ContactPeriodStats } from '../model/types'

/** "Growth": everyone subscribed at the end of each bucket of the page's period; a bucket with imported contacts is marked. */
export function GrowthCard({ stats }: { stats: ContactPeriodStats }) {
  const { buckets, step } = stats
  const { labels, titles } = bucketLabels(
    buckets.map((bucket) => bucket.start),
    step,
    inZone(stats.range.to, stats.timezone),
    stats.period === '6m',
  )
  const imported = buckets.map((bucket) => (bucket.imported > 0 ? `${number(bucket.imported)} imported` : ''))
  const hasImports = imported.some(Boolean)
  const phrase = periodPhrase(stats.period)
  return (
    <Card title="Growth" subtitle={`Everyone subscribed · ${phrase}`}>
      <ChartLegend
        title={`Subscribers at the end of each ${step}`}
        keys={hasImports ? [{ label: `${step[0].toUpperCase()}${step.slice(1)} with imported contacts`, note: true }] : []}
      />
      <AreaChart
        labels={labels}
        titles={titles}
        values={buckets.map((bucket) => bucket.total)}
        notes={imported}
        label={`Subscribers at the end of each ${step}, ${phrase}`}
        formatValue={(value) => number(Math.round(value))}
        describe={(value) => plural(Math.round(value), 'subscriber')}
      />
    </Card>
  )
}
