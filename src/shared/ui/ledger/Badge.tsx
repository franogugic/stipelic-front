import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { BadgeTone } from './status'

/** Pill label. `dot` adds the status dot, `live` also pulses it; `icon` is a leading glyph. */
export function Badge({
  tone,
  icon: Icon,
  dot,
  live,
  className,
  children,
}: {
  tone?: BadgeTone
  icon?: LucideIcon
  dot?: boolean
  live?: boolean
  className?: string
  children: ReactNode
}) {
  const classes = ['badge', tone && `badge--${tone}`, live && 'badge--live', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      {(dot || live) && <span className="badge__dot" aria-hidden="true" />}
      {Icon && <Icon />}
      {children}
    </span>
  )
}
