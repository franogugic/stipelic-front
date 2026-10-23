import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { percent } from '../../lib/format'
import { Sparkline } from './Sparkline'

/** One KPI cell of a `.board`: label, big value, a meta line, and an optional trend or share bar. */
export function KpiCell({
  label,
  icon: Icon,
  value,
  meta,
  spark,
  bar,
}: {
  label: ReactNode
  icon: LucideIcon
  value: ReactNode
  meta?: ReactNode
  spark?: { values: number[]; label: string }
  /** A thin bar showing the value as part of the whole; `ratio` is a percentage. */
  bar?: { ratio: number; tone?: 'accent' | 'success' | 'warning' | 'danger' | 'ink' }
}) {
  return (
    <div className="kpi">
      <span className="metric__label">
        <Icon />
        {label}
      </span>
      <span className="kpi__value">{value}</span>
      <span className="kpi__meta">{meta}</span>
      {spark && (
        <div className="kpi__spark">
          <Sparkline values={spark.values} label={spark.label} />
        </div>
      )}
      {bar && (
        <div className={`kpi__bar kpi__bar--${bar.tone ?? 'accent'}`} aria-hidden="true">
          <span style={{ '--w': `${Math.min(Math.max(bar.ratio, 0), 100).toFixed(1)}%` } as CSSProperties} />
        </div>
      )}
    </div>
  )
}

/** Change in percentage points against an average (an open rate against your other campaigns). */
export function PointsBadge({
  value,
  average,
  lowerIsBetter = false,
}: {
  value: number
  /** Null when there is nothing to compare with: nothing is drawn. */
  average: number | null
  lowerIsBetter?: boolean
}) {
  if (average === null) return null
  const diff = value - average
  const flat = Math.abs(diff) < 0.5
  const tone = flat ? 'flat' : diff > 0 !== lowerIsBetter ? 'up' : 'down'
  const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`delta delta--${tone}`}>
      {!flat && <Icon />}
      {flat ? '±0' : Math.abs(diff).toFixed(1)} pts
    </span>
  )
}

/** Change since last month, in percent: "New" when there was nothing before, a flat dash when both are zero. */
export function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (!previous) {
    return current ? (
      <span className="delta delta--up">
        <ArrowUpRight />
        New
      </span>
    ) : (
      <span className="delta delta--flat">—</span>
    )
  }
  const change = ((current - previous) / previous) * 100
  const tone = Math.abs(change) < 0.5 ? 'flat' : change > 0 ? 'up' : 'down'
  return (
    <span className={`delta delta--${tone}`}>
      {tone !== 'flat' && (change > 0 ? <ArrowUpRight /> : <ArrowDownRight />)}
      {percent(Math.abs(change), 0)}
    </span>
  )
}
