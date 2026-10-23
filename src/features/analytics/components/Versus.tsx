import { monthYear } from '../../../shared/lib/format'
import { DeltaBadge } from '../../../shared/ui/ledger'
import { PERIODS, formatMetric, valueOf, wallTime } from '../model/series'
import type { AnalyticsMetric, AnalyticsSeries } from '../model/types'

/** The meta line under a figure: the change against the period before, or the best month for "All time". */
export function Versus({ series, metric }: { series: AnalyticsSeries; metric: AnalyticsMetric }) {
  const period = PERIODS.find((candidate) => candidate.id === series.period)
  const previous = series.previousTotals
  if (previous) {
    return (
      <>
        <DeltaBadge current={valueOf(series.totals, metric)} previous={valueOf(previous, metric)} />
        <span>
          vs {formatMetric(metric, valueOf(previous, metric), series.currency)} {period?.compare}
        </span>
      </>
    )
  }
  const best = series.bestMonth?.[metric]
  return best ? (
    <span>
      Best month: <strong>{monthYear(wallTime(`${best.month}-01`))}</strong> · {formatMetric(metric, best.value, series.currency)}
    </span>
  ) : (
    <span>Nothing yet</span>
  )
}
