import type { ElementType, ReactNode } from 'react'

export type CardVariant = 'feature' | 'interactive' | 'sunken'

const join = (...names: Array<string | false | undefined>) => names.filter(Boolean).join(' ')

/**
 * Surface. Two ways to use it:
 * - with `title` (and optional `subtitle` / `action` / `flush`) it renders the prototype's card() helper
 *   markup: header with heading + action, then the body;
 * - without `title` it is just the `.card` shell, composed from CardHeader / CardBody / CardFooter.
 */
export function Card({
  as: Tag = 'section',
  variant,
  title,
  subtitle,
  action,
  flush,
  headingLevel = 2,
  className,
  bodyClassName,
  children,
}: {
  as?: ElementType
  variant?: CardVariant
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  /** Removes the body padding (tables, lists). */
  flush?: boolean
  headingLevel?: 2 | 3
  className?: string
  bodyClassName?: string
  children?: ReactNode
}) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3'
  return (
    <Tag className={join('card', variant && `card--${variant}`, className)}>
      {title !== undefined ? (
        <>
          <div className="card__header">
            <div className="card__heading">
              <Heading className="card__title">{title}</Heading>
              {subtitle && <p className="card__subtitle">{subtitle}</p>}
            </div>
            {action}
          </div>
          <div className={join('card__body', flush && 'card__body--flush', bodyClassName)}>{children}</div>
        </>
      ) : (
        children
      )}
    </Tag>
  )
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={join('card__header', className)}>{children}</div>
}

export function CardTitle({ as: Tag = 'h3', children }: { as?: 'h2' | 'h3'; children: ReactNode }) {
  return <Tag className="card__title">{children}</Tag>
}

export function CardSubtitle({ as: Tag = 'span', children }: { as?: 'span' | 'p'; children: ReactNode }) {
  return <Tag className="card__subtitle">{children}</Tag>
}

export function CardBody({ flush, className, children }: { flush?: boolean; className?: string; children?: ReactNode }) {
  return <div className={join('card__body', flush && 'card__body--flush', className)}>{children}</div>
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={join('card__footer', className)}>{children}</div>
}
