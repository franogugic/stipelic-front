import { Ellipsis } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Button } from './Button'
import type { ButtonVariant } from './Button'
import { positionFloating } from './floating'

export type MenuItem =
  | 'separator'
  | {
      label: string
      icon?: LucideIcon
      tone?: 'danger'
      disabled?: boolean
      /** Disables the item and explains why in its tooltip (the Button `disabledReason` pattern). */
      disabledReason?: string
    } & ({ onSelect: () => void; to?: undefined; href?: undefined } | { to: string; onSelect?: undefined; href?: undefined } | { href: string; external?: boolean; onSelect?: undefined; to?: undefined })

/**
 * Dropdown menu. Opens on click or ArrowDown / ArrowUp on the trigger; ↑ ↓ Home End move focus, Enter and
 * Space activate, Esc closes and returns focus to the trigger, Tab / outside click / scroll / resize close.
 * The default trigger is an icon-only ghost "ellipsis" button; `triggerLabel` makes it a labelled button.
 */
export function Menu({
  label,
  items,
  align = 'end',
  triggerLabel,
  triggerIcon = Ellipsis,
  triggerVariant,
  triggerSize,
}: {
  /** Accessible name of the menu (and of the trigger when it has no visible label). */
  label: string
  items: Array<MenuItem | false | null | undefined>
  align?: 'start' | 'end'
  triggerLabel?: string
  triggerIcon?: LucideIcon
  triggerVariant?: ButtonVariant
  triggerSize?: 'sm' | 'lg'
}) {
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const initialFocus = useRef<'first' | 'last'>('first')

  const visibleItems = items.filter((item): item is MenuItem => Boolean(item))

  const enabledItems = useCallback(
    () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []),
    [],
  )

  const close = useCallback((restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }, [])

  const openMenu = (focus: 'first' | 'last') => {
    initialFocus.current = focus
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return
    positionFloating(menuRef.current, triggerRef.current, { align })
    const targets = enabledItems()
    const target = initialFocus.current === 'last' ? targets[targets.length - 1] : targets[0]
    target?.focus()
  }, [open, align, enabledItems])

  useEffect(() => {
    if (!open) return
    const onDocumentClick = (event: Event) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      close()
    }
    const onDismiss = () => close()
    document.addEventListener('click', onDocumentClick)
    window.addEventListener('scroll', onDismiss, { passive: true, capture: true })
    window.addEventListener('resize', onDismiss, { passive: true, capture: true })
    return () => {
      document.removeEventListener('click', onDocumentClick)
      window.removeEventListener('scroll', onDismiss, { capture: true })
      window.removeEventListener('resize', onDismiss, { capture: true })
    }
  }, [open, close])

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu(event.key === 'ArrowUp' ? 'last' : 'first')
    }
  }

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const targets = enabledItems()
    const index = targets.indexOf(document.activeElement as HTMLElement)
    const move = (next: number) => {
      event.preventDefault()
      targets[(next + targets.length) % targets.length]?.focus()
    }
    switch (event.key) {
      case 'ArrowDown':
        move(index + 1)
        break
      case 'ArrowUp':
        move(index - 1)
        break
      case 'Home':
        move(0)
        break
      case 'End':
        move(targets.length - 1)
        break
      case 'Escape':
        event.preventDefault()
        close(true)
        break
      case 'Tab':
        close()
        break
      case ' ':
        // Links do not activate on Space natively; menu items should.
        if (document.activeElement instanceof HTMLAnchorElement) {
          event.preventDefault()
          document.activeElement.click()
        }
        break
      default:
    }
  }

  const renderItem = (item: MenuItem, index: number) => {
    if (item === 'separator') return <div className="menu__separator" role="separator" key={index} />
    const Icon = item.icon
    const className = ['menu__item', item.tone === 'danger' && 'menu__item--danger'].filter(Boolean).join(' ')
    const content = (
      <>
        {Icon && <Icon />}
        <span>{item.label}</span>
      </>
    )
    const disabled = item.disabled || Boolean(item.disabledReason)
    const ariaDisabled = disabled ? true : undefined
    const tooltip = item.disabledReason ? { 'data-tooltip': item.disabledReason } : {}
    const guard = (event: MouseEvent) => {
      if (disabled) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
      return true
    }
    if (item.to !== undefined) {
      return (
        <Link className={className} role="menuitem" tabIndex={-1} to={item.to} aria-disabled={ariaDisabled} {...tooltip} key={index}
          onClick={(event) => { if (guard(event)) close() }}>
          {content}
        </Link>
      )
    }
    if (item.href !== undefined) {
      return (
        <a className={className} role="menuitem" tabIndex={-1} href={item.href} aria-disabled={ariaDisabled} {...tooltip} key={index}
          {...(item.external ? { target: '_blank', rel: 'noopener' } : {})}
          onClick={(event) => { if (guard(event)) close() }}>
          {content}
        </a>
      )
    }
    return (
      <button className={className} type="button" role="menuitem" tabIndex={-1} aria-disabled={ariaDisabled} {...tooltip} key={index}
        onClick={(event) => {
          if (!guard(event)) return
          close(true)
          item.onSelect()
        }}>
        {content}
      </button>
    )
  }

  return (
    <>
      {triggerLabel ? (
        <Button
          ref={triggerRef}
          variant={triggerVariant ?? 'secondary'}
          size={triggerSize}
          icon={triggerIcon}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          data-menu-align={align}
          onKeyDown={onTriggerKeyDown}
          onClick={() => (open ? close() : openMenu('first'))}
        >
          {triggerLabel}
        </Button>
      ) : (
        <Button
          ref={triggerRef}
          variant={triggerVariant ?? 'ghost'}
          size={triggerSize ?? 'sm'}
          icon={triggerIcon}
          iconOnly
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          data-menu-align={align}
          onKeyDown={onTriggerKeyDown}
          onClick={() => (open ? close() : openMenu('first'))}
        />
      )}
      {open &&
        createPortal(
          <div className="menu" id={menuId} role="menu" aria-label={label} ref={menuRef} onKeyDown={onMenuKeyDown}>
            {visibleItems.map(renderItem)}
          </div>,
          document.body,
        )}
    </>
  )
}
