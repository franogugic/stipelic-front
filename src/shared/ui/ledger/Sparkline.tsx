import type { CSSProperties } from 'react'

/** Monotone cubic interpolation (no overshoot) through the points, as an SVG path. */
function monotonePath(points: Array<[number, number]>) {
  const n = points.length
  if (n < 2) return ''
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i += 1) {
    dx.push(points[i + 1][0] - points[i][0])
    slope.push((points[i + 1][1] - points[i][1]) / dx[i])
  }
  const tangent = [slope[0]]
  for (let i = 1; i < n - 1; i += 1) {
    tangent.push(
      slope[i - 1] * slope[i] <= 0
        ? 0
        : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]),
    )
  }
  tangent.push(slope[n - 2])
  let path = `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`
  for (let i = 0; i < n - 1; i += 1) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    const h = dx[i] / 3
    path += ` C${(x0 + h).toFixed(2)} ${(y0 + tangent[i] * h).toFixed(2)} ${(x1 - h).toFixed(2)} ${(y1 - tangent[i + 1] * h).toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`
  }
  return path
}

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
