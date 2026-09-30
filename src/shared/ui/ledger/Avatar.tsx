import type { ReactNode } from 'react'

/** Initials avatar. Decorative (aria-hidden) unless `label` is given. */
export function Avatar({
  size,
  neutral,
  label,
  className,
  children,
}: {
  size?: 'xs' | 'sm' | 'lg' | 'xl'
  neutral?: boolean
  label?: string
  className?: string
  children: ReactNode
}) {
  const classes = ['avatar', size && `avatar--${size}`, neutral && 'avatar--neutral', className].filter(Boolean).join(' ')
  return label ? (
    <span className={classes} role="img" aria-label={label}>
      {children}
    </span>
  ) : (
    <span className={classes} aria-hidden="true">
      {children}
    </span>
  )
}
