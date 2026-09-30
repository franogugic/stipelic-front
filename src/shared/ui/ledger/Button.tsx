import type { LucideIcon } from 'lucide-react'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'

type Shared = {
  variant?: ButtonVariant
  size?: 'sm' | 'lg'
  block?: boolean
  /** Leading icon; the label is then wrapped in a span, as in the prototype. */
  icon?: LucideIcon
  /** Sets aria-busy; the spinner comes from the CSS. */
  loading?: boolean
  /**
   * Explains why the action is unavailable (e.g. a plan limit). The button stays focusable, shows the
   * reason as a tooltip and swallows the click.
   */
  disabledReason?: string
  className?: string
  /** React 19 passes `ref` as a prop; it lands on the rendered element. */
  ref?: Ref<HTMLButtonElement>
  children?: ReactNode
}

// An icon-only button has no visible label, so the accessible name is mandatory.
type IconOnly = { iconOnly: true; 'aria-label': string } | { iconOnly?: false }

type NativeProps = Shared & IconOnly & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Shared | 'aria-label'> & {
  'aria-label'?: string
  to?: undefined
  href?: undefined
}
type RouterLinkProps = Shared & IconOnly & Omit<LinkProps, keyof Shared | 'aria-label' | 'to'> & {
  'aria-label'?: string
  to: LinkProps['to']
  href?: undefined
}
type AnchorProps = Shared & IconOnly & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Shared | 'aria-label' | 'href'> & {
  'aria-label'?: string
  href: string
  to?: undefined
}

export type ButtonProps = NativeProps | RouterLinkProps | AnchorProps

/** Renders `<button>` by default, a React Router `<Link>` when given `to`, and `<a>` when given `href`. */
export function Button(props: ButtonProps) {
  const {
    variant = 'secondary',
    size,
    block,
    icon: Icon,
    loading,
    disabledReason,
    iconOnly,
    className,
    children,
    ...rest
  } = props as Shared & { iconOnly?: boolean; onClick?: (event: MouseEvent<HTMLElement>) => void } & Record<string, unknown>

  const classes = [
    'btn',
    `btn--${variant}`,
    size && `btn--${size}`,
    iconOnly && 'btn--icon',
    block && 'btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const isAriaDisabled = Boolean(disabledReason) || rest['aria-disabled'] === true || rest['aria-disabled'] === 'true'
  const originalOnClick = rest.onClick as ((event: MouseEvent<HTMLElement>) => void) | undefined

  const shared = {
    ...rest,
    className: classes,
    'aria-busy': loading ? true : undefined,
    'aria-disabled': isAriaDisabled ? true : undefined,
    'data-tooltip': disabledReason ?? (rest['data-tooltip'] as string | undefined),
    onClick: (event: MouseEvent<HTMLElement>) => {
      // aria-disabled controls stay focusable so the tooltip can explain why, but never act.
      if (isAriaDisabled || loading) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      originalOnClick?.(event)
    },
  }

  const content = iconOnly ? (
    Icon && <Icon />
  ) : (
    <>
      {Icon && <Icon />}
      {Icon ? <span>{children}</span> : children}
    </>
  )

  if (props.to !== undefined) {
    return (
      <Link {...(shared as Omit<LinkProps, 'to'>)} to={props.to}>
        {content}
      </Link>
    )
  }
  if (props.href !== undefined) {
    return (
      <a {...(shared as AnchorHTMLAttributes<HTMLAnchorElement>)} href={props.href}>
        {content}
      </a>
    )
  }
  return (
    <button type="button" {...(shared as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  )
}
