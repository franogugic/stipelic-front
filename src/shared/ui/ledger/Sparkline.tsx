import type { CSSProperties } from 'react'
import { monotonePath } from '../../lib/curve'

/** Inline-SVG trend line with an area fill and an end dot. Decorative unless `label` is given. */
export function Sparkline({ values, label }: { values: number[]; label?: string }) {
  const height = 40
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const points: Array<[number, number]> = values.map((value, index) => [
    (index / Math.max(values.length - 1, 1)) * 100,
    height - 3 - ((value - min) / span) * (height - 6),
  ])
  const line = monotonePath(points)
  const lastY = points[points.length - 1][1]
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <div className="sparkline-wrap" style={{ '--spark-y': `${((lastY / height) * 100).toFixed(1)}%` } as CSSProperties}>
      <svg className="sparkline" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" {...a11y}>
        <path className="sparkline__area" d={`${line} L100 ${height} L0 ${height} Z`} />
        <path className="sparkline__line" d={line} />
      </svg>
      <span className="sparkline__end" aria-hidden="true" />
    </div>
  )
}
