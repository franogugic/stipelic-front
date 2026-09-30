import type { CSSProperties } from 'react'

/** Horizontal share bars; colours cycle through `--chart-1…6`. `display` is the formatted value text. */
export function HBars({ rows }: { rows: Array<{ label: string; value: number; display: string }> }) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  return (
    <div className="stack stack--md">
      {rows.map((row, i) => (
        <div className="hbar" key={row.label}>
          <div className="hbar__head">
            <span>{row.label}</span>
            <span className="num">{row.display}</span>
          </div>
          <div className="hbar__track">
            <div
              className="hbar__fill"
              style={{ '--w': `${((row.value / max) * 100).toFixed(1)}%`, '--c': `var(--chart-${(i % 6) + 1})` } as CSSProperties}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
