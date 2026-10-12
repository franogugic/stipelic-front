/** Monotone cubic interpolation (no overshoot) through the points, as an SVG path. */
export function monotonePath(points: Array<[number, number]>) {
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

/** Top of the y-axis: a round number whose half is round too (0 · 20 · 40, never 0 · 12.5 · 25). */
export function axisMax(value: number, floor = 2) {
  if (value <= floor) return floor
  if (value < 10) return Math.ceil(value / 2) * 2
  const power = 10 ** Math.floor(Math.log10(value))
  return [1, 2, 3, 4, 5, 6, 8, 10].map((step) => step * power).find((candidate) => candidate >= value) ?? value
}
