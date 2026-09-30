import type { CSSProperties } from 'react'

/**
 * Column chart in plain CSS. The last column is highlighted; each column carries a tooltip
 * ("{label}: {value}", shown by the TooltipProvider).
 */
export function Bars({
  values,
  labels,
  formatValue,
  label = 'Bar chart',
}: {
  values: number[]
  labels: string[]
  formatValue: (value: number) => string
  label?: string
}) {
  const max = Math.max(...values, 1)
  return (
    <div className="bars" role="img" aria-label={label}>
      {values.map((value, i) => (
        <div
          key={i}
          className={['bars__col', i === values.length - 1 && 'bars__col--hi'].filter(Boolean).join(' ')}
          data-tooltip={`${labels[i]}: ${formatValue(value)}`}
        >
          <span className="bars__bar" style={{ '--h': `${((value / max) * 100).toFixed(1)}%` } as CSSProperties} />
          <span className="bars__label">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}
