import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { monthYear, number } from '../../../shared/lib/format'
import { AreaChart, ChartLegend, DeltaBadge, EmptyState, Money } from '../../../shared/ui/ledger'
import type { StateAction } from '../../../shared/ui/ledger'
import { METRICS, PERIODS, chartOf, describeMetric, formatMetric, metricById, valueOf, wallTime } from '../model/series'
import type { AnalyticsMetric, AnalyticsSeries } from '../model/types'

/**
 * KPI tabs that pick the chart's metric, the chart, and a strip of derived stats — the prototype's
 * `analyticsBoard()`. `stats` returns [label, value] pairs for the strip.
 */
export function AnalyticsBoard({
  series,
  metric,
  order,
  name,
  empty,
  stats,
  onMetric,
}: {
  series: AnalyticsSeries
  metric: AnalyticsMetric
  order: AnalyticsMetric[]
  name: string
  /** When set, the chart is replaced by this empty state. */
  empty?: { icon?: LucideIcon; title: string; text: string; action?: StateAction }
  stats: (totals: AnalyticsSeries['totals']) => Array<[string, ReactNode]>
  onMetric: (metric: AnalyticsMetric) => void
}) {
  const period = PERIODS.find((candidate) => candidate.id === series.period) ?? PERIODS[1]
  const def = metricById(metric, 'views')
  const chart = chartOf(series, metric)
  const currency = series.currency
  const previous = series.previousTotals

  return (
    <section className="card board" aria-label={`${name}, ${period.label.toLowerCase()}`}>
      <div className="board__kpis" role="radiogroup" aria-label="Metric shown in the chart">
        {order.map((id) => {
          const cell = METRICS.find((candidate) => candidate.id === id)!
          const Icon = cell.icon
          const best = series.bestMonth?.[id]
          return (
            <label className="kpi kpi--tab" key={id}>
              <input className="kpi__input" type="radio" name="metric" value={id} checked={metric === id} onChange={() => onMetric(id)} />
              <span className="metric__label">
                <Icon />
                {cell.label}
              </span>
              <span className="kpi__value">
                {id === 'revenue' ? <Money amountCents={series.totals.revenueCents} currency={currency} /> : number(valueOf(series.totals, id))}
              </span>
              <span className="kpi__meta">
                {previous ? (
                  <>
                    <DeltaBadge current={valueOf(series.totals, id)} previous={valueOf(previous, id)} />
                    <span>vs {period.compare}</span>
                  </>
                ) : best ? (
                  <span>
                    Best month: <strong>{monthYear(wallTime(`${best.month}-01`))}</strong> · {formatMetric(id, best.value, currency)}
                  </span>
                ) : (
                  <span>Nothing yet</span>
                )}
              </span>
            </label>
          )
        })}
      </div>
      <div className="board__body">
        {empty ? (
          <EmptyState compact icon={empty.icon} title={empty.title} text={empty.text} action={empty.action} />
        ) : (
          <>
            <ChartLegend
              title={`${def.label} per ${period.step}`}
              keys={[
                { label: series.period === 'today' ? 'Today' : period.label },
                ...(period.compare ? [{ label: series.period === 'today' ? 'Yesterday' : `${period.compare[0].toUpperCase()}${period.compare.slice(1)}`, previous: true }] : []),
              ]}
            />
            <AreaChart
              labels={chart.labels}
              titles={chart.titles}
              values={chart.values}
              previous={chart.previous}
              label={`${def.label} per ${period.step}, ${period.label.toLowerCase()}`}
              formatValue={(value) => formatMetric(metric, value, currency)}
              describe={(value) => describeMetric(metric, value, currency)}
              axisFloor={metric === 'revenue' ? 1000 : 2}
            />
          </>
        )}
      </div>
      <dl className="board__stats">
        {stats(series.totals).map(([label, value]) => (
          <div className="board__stat" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

