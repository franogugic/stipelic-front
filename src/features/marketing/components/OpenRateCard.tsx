import { month, monthYear } from '../../../shared/lib/format'
import { Badge, Bars, Card, ErrorState, SkeletonBlock } from '../../../shared/ui/ledger'
import type { OpenRateTrend } from '../model/types'

const asPercent = (rate: number) => Math.round(rate * 100)

/** "Open rate": the monthly open rate over the last months. A month without delivered mail counts as 0%. */
export function OpenRateCard({
  trend,
  status,
  onRetry,
}: {
  trend: OpenRateTrend | null
  status: 'idle' | 'loading' | 'success' | 'error'
  onRetry: () => void
}) {
  if (!trend) {
    return (
      <Card title="Open rate">
        {status === 'error' ? <ErrorState compact title="Couldn’t load the open rate" onRetry={onRetry} /> : <SkeletonBlock />}
      </Card>
    )
  }

  const average = trend.averageRate === null ? '' : ` · average ${asPercent(trend.averageRate)}%`

  return (
    <Card
      title="Open rate"
      subtitle={`Last ${trend.points.length} months${average}`}
      action={trend.currentRate === null ? undefined : <Badge tone="solid-accent">{asPercent(trend.currentRate)}% now</Badge>}
    >
      <Bars
        values={trend.points.map((point) => (point.rate === null ? 0 : asPercent(point.rate)))}
        labels={trend.points.map((point) => month(`${point.month}-15`))}
        tooltipLabels={trend.points.map((point) => monthYear(`${point.month}-15`))}
        formatValue={(value) => `${value}%`}
        label="Open rate by month"
      />
    </Card>
  )
}
