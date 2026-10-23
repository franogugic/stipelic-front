import { Card, AreaChart, ChartLegend, Segmented } from '../../../../shared/ui/ledger'
import { QuietPeriod } from '../../../analytics/components/QuietPeriod'
import { PERIODS, chartOf, describeMetric, formatMetric, metricById } from '../../../analytics/model/series'
import type { AnalyticsMetric, AnalyticsSeries } from '../../../analytics/model/types'

/** The dashboard calls the emails of a free product "sign-ups". */
const labelOf = (id: AnalyticsMetric) => (id === 'emails' ? 'Sign-ups' : metricById(id, id).label)

/** The chart: the chosen metric over the period, in hours, days, weeks or months, against the period before. */
export function DashboardChart({
  series,
  metrics,
  metric,
  onMetric,
  scopeName,
  onShowAll,
}: {
  series: AnalyticsSeries
  metrics: AnalyticsMetric[]
  metric: AnalyticsMetric
  onMetric: (metric: AnalyticsMetric) => void
  /** The product the page is narrowed to; null: all products. */
  scopeName: string | null
  onShowAll: () => void
}) {
  const period = PERIODS.find((candidate) => candidate.id === series.period) ?? PERIODS[1]
  const label = labelOf(metric)
  const chart = chartOf(series, metric)
  const currency = series.currency
  return (
    <Card
      title={`${label} over time`}
      subtitle={scopeName ?? 'All products'}
      action={
        <Segmented
          label="Shown in the chart"
          options={metrics.map((id) => ({ value: id, label: labelOf(id) }))}
          value={metric}
          onChange={(value) => onMetric(value as AnalyticsMetric)}
        />
      }
    >
      {chart.values.some(Boolean) ? (
        <>
          <ChartLegend
            title={`${label} per ${period.step}`}
            keys={[
              { label: series.period === 'today' ? 'Today' : period.label },
              ...(period.compare
                ? [{ label: series.period === 'today' ? 'Yesterday' : `${period.compare[0].toUpperCase()}${period.compare.slice(1)}`, previous: true }]
                : []),
            ]}
          />
          <AreaChart
            labels={chart.labels}
            titles={chart.titles}
            values={chart.values}
            previous={chart.previous}
            label={`${label} per ${period.step}, ${period.label.toLowerCase()}`}
            formatValue={(value) => formatMetric(metric, value, currency)}
            describe={(value) => describeMetric(metric, value, currency)}
            axisFloor={metric === 'revenue' ? 1000 : 2}
          />
        </>
      ) : (
        <QuietPeriod
          period={series.period}
          title={`No ${label.toLowerCase()} in this period`}
          text={`Nothing came in ${period.id === 'today' ? 'today' : period.id === 'all' ? 'so far' : `during the ${period.label.toLowerCase()}`}${scopeName ? ` for ${scopeName}` : ''}.`}
          onShowAll={onShowAll}
        />
      )}
    </Card>
  )
}
