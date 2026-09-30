import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import type { ButtonVariant } from './Button'

export type BannerTone = 'info' | 'success' | 'warning' | 'danger'

type BannerAction = { label: string; variant: ButtonVariant } & ({ to: string; href?: undefined } | { href: string; to?: undefined })

/** Workspace banner above a screen (the shell mounts it in Unit 3). Markup from the prototype's bannerMarkup. */
export function Banner({
  tone,
  icon: Icon,
  title,
  action,
  children,
}: {
  tone: BannerTone
  icon: LucideIcon
  title: ReactNode
  action: BannerAction
  children?: ReactNode
}) {
  const { label, variant, ...target } = action
  return (
    <div className={`banner banner--${tone}`} role="status">
      <div className="banner__inner">
        <span className="banner__icon">
          <Icon />
        </span>
        <p className="banner__text">
          <strong>{title}</strong> {children}
        </p>
        <Button variant={variant} size="sm" {...target}>
          {label}
        </Button>
      </div>
    </div>
  )
}
