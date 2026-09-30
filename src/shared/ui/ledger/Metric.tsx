import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Labelled figure. By default it is the prototype's metric() card (`article.card > .card__body.metric`);
 * with `card={false}` only the `.metric` block is rendered, to be placed inside another card.
 * `size` `hero` / `xl` scale the value (`.metric--hero`, `.metric--xl`).
 */
export function Metric({
  label,
  icon: Icon,
  value,
  meta,
  size,
  card = true,
}: {
  label: ReactNode
  icon?: LucideIcon
  value: ReactNode
  meta?: ReactNode
  size?: 'xl' | 'hero'
  card?: boolean
}) {
  const inner = (
    <>
      <span className="metric__label">
        {Icon && <Icon />}
        {label}
      </span>
      <span className="metric__value">{value}</span>
      {meta && <span className="metric__meta">{meta}</span>}
    </>
  )
  const metricClass = ['metric', size && `metric--${size}`].filter(Boolean).join(' ')
  if (!card) return <div className={metricClass}>{inner}</div>
  return (
    <article className="card">
      <div className={`card__body ${metricClass}`}>{inner}</div>
    </article>
  )
}
