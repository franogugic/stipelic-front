import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { axisMax, monotonePath } from '../../lib/curve'

const WIDTH = 700
const HEIGHT = 260

const pct = (value: number, total: number) => `${((value / total) * 100).toFixed(2)}%`

// The x-axis labels are 11 px text; this is a generous per-character width, plus the air kept between two labels.
const CHAR_WIDTH = 6.4
const LABEL_GAP = 14

/**
 * The labels to draw on the x-axis: always the first and the last, with the ones between at an even step wide enough
 * that two labels never touch at the width the axis really has (the first is left-aligned, the last right-aligned,
 * the rest centred on their point).
 */
function visibleLabels(labels: string[], width: number): number[] {
  const slots = labels.length
  if (slots === 0) return []
  if (slots === 1) return [0]
  const size = (index: number) => labels[index].length * CHAR_WIDTH
  const at = (index: number) => (index / (slots - 1)) * width
  const left = (index: number) => (index === 0 ? at(index) : index === slots - 1 ? at(index) - size(index) : at(index) - size(index) / 2)
  const right = (index: number) => left(index) + size(index)
  const widest = Math.max(...labels.map((text) => text.length)) * CHAR_WIDTH
  const step = Math.max(1, Math.ceil((widest + LABEL_GAP) / (width / (slots - 1))))
  // Every `step`-th label from the first, kept only while it clears the one before it (the first and last are aligned
  // to the edges, so their extents differ from the centred ones).
  const picked: number[] = []
  for (let index = 0; index < slots - 1; index += step) {
    const previous = picked[picked.length - 1]
    if (previous === undefined || left(index) >= right(previous) + LABEL_GAP) picked.push(index)
  }
  // The last point is always named: it replaces the labels before it that it would touch.
  const last = slots - 1
  while (picked.length > 0 && right(picked[picked.length - 1]) + LABEL_GAP > left(last)) picked.pop()
  picked.push(last)
  return picked
}

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
  notes,
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
  /** A short note per point ("128 imported"); a point with one is ringed and the note joins its tooltip. */
  notes?: string[] | null
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
  const axisRef = useRef<HTMLDivElement>(null)
  const [axisWidth, setAxisWidth] = useState(560)
  // The labels that fit follow the width the axis has, so they thin out on a narrow screen and never overlap.
  useEffect(() => {
    const element = axisRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setAxisWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const axis = visibleLabels(labels, axisWidth).map((index) => ({ text: labels[index], index }))
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
        {notes?.map((note, index) =>
          note ? <span className="area-chart__note" style={{ '--x': pct(x(index), WIDTH), '--y': pct(y(values[index]), HEIGHT) } as CSSProperties} key={index} /> : null,
        )}
        <div className="area-chart__hits" style={{ '--w': pct(1, Math.max(slots - 1, 1)) } as CSSProperties}>
          {values.map((value, index) => (
            <span
              key={index}
              style={{ '--x': pct(x(index), WIDTH) } as CSSProperties}
              data-tooltip={`${titles[index]}${split && index === last ? ' (so far)' : ''} · ${describe(value)}${versus(index)}${notes?.[index] ? ` · ${notes[index]}` : ''}`}
            />
          ))}
        </div>
      </div>
      <div className="area-chart__x" aria-hidden="true" ref={axisRef}>
        {axis.map(({ text, index }) => (
          <span
            key={index}
            className={index === 0 ? 'is-start' : index === slots - 1 ? 'is-end' : undefined}
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
                <th scope="row">
                  {titles[index]}
                  {notes?.[index] ? ` (${notes[index]})` : ''}
                </th>
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
export function ChartLegend({ title, keys }: { title: string; keys: Array<{ label: string; previous?: boolean; note?: boolean }> }) {
  return (
    <div className="chart-legend">
      <span className="chart-legend__title">{title}</span>
      <span className="chart-legend__keys">
        {keys.map((key) => (
          <span className={`chart-legend__key chart-legend__key--${key.note ? 'note' : key.previous ? 'previous' : 'current'}`} key={key.label}>
            {key.label}
          </span>
        ))}
      </span>
    </div>
  )
}
