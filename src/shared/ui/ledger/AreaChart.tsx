import type { CSSProperties } from 'react'
import { axisMax, monotonePath } from '../../lib/curve'

const WIDTH = 700
const HEIGHT = 260

const pct = (value: number, total: number) => `${((value / total) * 100).toFixed(2)}%`

/**
 * Area chart with an optional dashed "previous" line, a y-axis gutter, hover tooltips and a data table for screen
 * readers — the prototype's `areaChart()`. `live` draws the newest bucket dashed (it is still running).
 */
export function AreaChart({
  labels,
  titles,
  values,
  previous,
  label,
  formatValue,
  describe,
  live = true,
  previousLabel = 'Period before',
  axisFloor,
}: {
  labels: string[]
  titles: string[]
  values: number[]
  previous?: number[] | null
  /** Accessible name of the chart. */
  label: string
  formatValue: (value: number) => string
  describe: (value: number) => string
  live?: boolean
  previousLabel?: string
  axisFloor?: number
}) {
  const slots = labels.length
  const max = axisMax(Math.max(...values, ...(previous ?? []), 0), axisFloor)
  const x = (index: number) => (index / Math.max(slots - 1, 1)) * WIDTH
  const y = (value: number) => HEIGHT - (value / max) * HEIGHT
  const points: Array<[number, number]> = values.map((value, index) => [x(index), y(value)])
  const last = values.length - 1
  const curveOf = (pts: Array<[number, number]>) => (pts.length > 1 ? monotonePath(pts) : `M${pts[0].join(' ')}`)
  const split = live && last > 0
  const settled = curveOf(split ? points.slice(0, -1) : points)
  const running = split ? `M${points[last - 1].join(' ')} L${points[last].join(' ')}` : ''
  const outline = split ? `${settled} L${points[last].join(' ')}` : settled
  const step = Math.ceil(slots / 7)
  const axis = labels
    .map((text, index) => ({ text, index }))
    .filter(({ index }) => index % step === 0 || (index === slots - 1 && (slots - 1) % step > step / 2))
  const versus = (index: number) => (previous ? ` · vs ${describe(previous[index])}` : '')

  if (slots === 0) return null

  return (
    <div className="area-chart" role="group" aria-label={label}>
      <div className="area-chart__plot" aria-hidden="true">
        {[1, 0.5, 0].map((ratio) => (
          <div className={`area-chart__grid${ratio ? '' : ' area-chart__grid--base'}`} style={{ '--y': pct(1 - ratio, 1) } as CSSProperties} key={ratio}>
            <span>{formatValue(max * ratio)}</span>
          </div>
        ))}
        <svg className="area-chart__svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
          {previous && previous.length > 0 && <path className="area-chart__prev" d={curveOf(previous.map((value, index) => [x(index), y(value)]))} />}
          <path className="area-chart__area" d={`${outline} L${x(last)} ${HEIGHT} L0 ${HEIGHT} Z`} />
          <path className="area-chart__line" d={settled} />
          {running && <path className="area-chart__line area-chart__line--running" d={running} />}
        </svg>
        <span className="area-chart__dot" style={{ '--x': pct(x(last), WIDTH), '--y': pct(y(values[last]), HEIGHT) } as CSSProperties} />
        <div className="area-chart__hits" style={{ '--w': pct(1, Math.max(slots - 1, 1)) } as CSSProperties}>
          {values.map((value, index) => (
            <span
              key={index}
              style={{ '--x': pct(x(index), WIDTH) } as CSSProperties}
              data-tooltip={`${titles[index]}${split && index === last ? ' (so far)' : ''} · ${describe(value)}${versus(index)}`}
            />
          ))}
        </div>
      </div>
      <div className="area-chart__x" aria-hidden="true">
        {axis.map(({ text, index }, position) => (
          <span
            key={index}
            className={index === 0 ? 'is-start' : index === slots - 1 ? 'is-end' : position % 2 ? 'is-minor' : undefined}
            style={{ '--x': pct(x(index), WIDTH) } as CSSProperties}
          >
            {text}
          </span>
        ))}
      </div>
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">This period</th>
              {previous && <th scope="col">{previousLabel}</th>}
            </tr>
          </thead>
          <tbody>
            {values.map((value, index) => (
              <tr key={index}>
                <th scope="row">{titles[index]}</th>
                <td>{formatValue(value)}</td>
                {previous && <td>{formatValue(previous[index])}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** The legend above a chart: what it measures and the keys of its lines. */
export function ChartLegend({ title, keys }: { title: string; keys: Array<{ label: string; previous?: boolean }> }) {
  return (
    <div className="chart-legend">
      <span className="chart-legend__title">{title}</span>
      <span className="chart-legend__keys">
        {keys.map((key) => (
          <span className={`chart-legend__key chart-legend__key--${key.previous ? 'previous' : 'current'}`} key={key.label}>
            {key.label}
          </span>
        ))}
      </span>
    </div>
  )
}
