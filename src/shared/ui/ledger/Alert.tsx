import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

/** Inline callout inside a screen. Markup: `.alert.alert--<tone>` > icon + `.alert__body`. */
export function Alert({
  tone,
  icon: Icon,
  title,
  action,
  live,
  className,
  children,
}: {
  tone: AlertTone
  icon: LucideIcon
  title?: ReactNode
  /** Rendered after the text inside the body, e.g. a `<a className="link">`. */
  action?: ReactNode
  /**
   * Announces the alert to screen readers when it appears: `role="alert"` for danger and warning,
   * `role="status"` for success and info. Without it the markup has no role.
   */
  live?: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={['alert', `alert--${tone}`, className].filter(Boolean).join(' ')}
      role={live ? (tone === 'danger' || tone === 'warning' ? 'alert' : 'status') : undefined}
    >
      <Icon />
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        {title && children ? <p>{children}</p> : children}
        {action}
      </div>
    </div>
  )
}
