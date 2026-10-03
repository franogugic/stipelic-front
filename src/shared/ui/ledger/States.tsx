import { ArrowUpRight, CloudOff, Gauge, Inbox, Plus, RotateCw, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { number } from '../../lib/format'
import { Button } from './Button'
import type { ButtonVariant } from './Button'
import { Meter } from './Meter'

/** Loading skeleton for lists: rows with an avatar circle and two text lines. */
export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <span className="skeleton skeleton--circle" />
          <div className="stack stack--sm">
            <span className={`skeleton ${index % 2 ? 'skeleton--mid' : 'skeleton--short'}`} />
            <span className="skeleton skeleton--short" />
          </div>
          <span className="skeleton skeleton--short" />
        </div>
      ))}
    </div>
  )
}

/** Loading skeleton for a row of metric cards. */
export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid--${Math.min(count, 4)}`} aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      {Array.from({ length: count }, (_, index) => (
        <div className="card" key={index}>
          <div className="card__body stack stack--md">
            <span className="skeleton skeleton--short" />
            <span className="skeleton skeleton--metric" />
            <span className="skeleton skeleton--mid" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonBlock() {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <span className="skeleton skeleton--block" />
    </div>
  )
}

export type StateAction = {
  label: string
  icon?: LucideIcon
  variant?: ButtonVariant
  onClick?: () => void
  to?: string
  href?: string
}

function ActionButton({ action }: { action: StateAction }) {
  const { label, variant = 'primary', ...target } = action
  return (
    <Button variant={variant} {...(target as object)}>
      {label}
    </Button>
  )
}

/** "Nothing here yet" state with an optional call to action. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  text,
  action,
  secondary,
  compact,
}: {
  icon?: LucideIcon
  title: ReactNode
  text?: ReactNode
  action?: StateAction
  secondary?: StateAction
  compact?: boolean
}) {
  return (
    <div className={['state', compact && 'state--compact'].filter(Boolean).join(' ')}>
      <div className="state__art">
        <Icon />
        <span className="state__badge">
          <Plus />
        </span>
      </div>
      <h2 className="state__title">{title}</h2>
      {text && <p className="state__text">{text}</p>}
      {(action || secondary) && (
        <div className="state__actions">
          {action && <ActionButton action={action} />}
          {secondary && <ActionButton action={secondary} />}
        </div>
      )}
    </div>
  )
}

/** A failed load, with a retry button — or `action` instead, when retrying can't help (e.g. not found). */
export function ErrorState({
  title = 'Something went wrong',
  text = 'We couldn’t load this data. Check your connection and try again.',
  onRetry,
  action,
  compact,
}: {
  title?: ReactNode
  text?: ReactNode
  onRetry?: () => void
  action?: StateAction
  compact?: boolean
}) {
  return (
    <div className={['state', 'state--error', compact && 'state--compact'].filter(Boolean).join(' ')} role="alert">
      <div className="state__art">
        <CloudOff />
        <span className="state__badge">
          <X />
        </span>
      </div>
      <h2 className="state__title">{title}</h2>
      <p className="state__text">{text}</p>
      <div className="state__actions">
        {action ? (
          <ActionButton action={{ variant: 'secondary', ...action }} />
        ) : (
          <Button variant="secondary" icon={RotateCw} onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  )
}

/** Plan-limit callout: the meter is full and the way out is an upgrade. */
export function PlanLimit({
  noun,
  planName,
  limit,
  upgradeTo,
}: {
  /** Plural resource name, e.g. "landing pages". */
  noun: string
  planName: string
  limit: number
  upgradeTo: string
}) {
  return (
    <div className="limit" role="status">
      <span className="limit__icon">
        <Gauge />
      </span>
      <div className="limit__body">
        <p className="limit__title">
          You’ve used all {number(limit)} {noun} on the {planName} plan
        </p>
        <p className="limit__text">Upgrade your plan to add more. Nothing you’ve already published is affected.</p>
        <Meter label={`${noun[0].toUpperCase()}${noun.slice(1)}`} used={limit} limit={limit} />
      </div>
      <Button variant="accent" icon={ArrowUpRight} to={upgradeTo}>
        Upgrade plan
      </Button>
    </div>
  )
}
