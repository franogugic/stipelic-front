import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Modal on the native `<dialog>` (top layer, inert background, focus trap). Controlled by `open` / `onClose`.
 * - `dismissible` (default true): when false, Esc, backdrop click and the close button do nothing.
 * - Focus goes to the element marked `data-autofocus`, else the first field, else the dialog's default;
 *   on close it returns to whatever had focus when the modal opened.
 * - `actions` fill the footer; forms in the body can be submitted from the footer with `form="<id>"`.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  tone,
  size,
  dismissible = true,
  actions,
  footerSplit,
  className,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  tone?: 'danger' | 'accent' | 'warning'
  size?: 'sm' | 'lg' | 'xl'
  dismissible?: boolean
  actions?: ReactNode
  footerSplit?: boolean
  className?: string
  children?: ReactNode
}) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const [mounted, setMounted] = useState(open)

  // Mount the dialog element as soon as it is asked to open (state adjusted during render, not in an effect).
  if (open && !mounted) setMounted(true)

  // Open in the top layer once the element exists.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !mounted || !dialog || dialog.open) return
    openerRef.current = document.activeElement as HTMLElement | null
    dialog.showModal()
    const target =
      dialog.querySelector<HTMLElement>('[data-autofocus]') ??
      dialog.querySelector<HTMLElement>('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')
    target?.focus()
  }, [open, mounted])

  // Close with the exit animation (skipped under reduced motion), then unmount and restore focus.
  useEffect(() => {
    const dialog = dialogRef.current
    if (open || !mounted || !dialog) return
    let cancelled = false
    const finish = () => {
      if (cancelled) return
      dialog.close()
      setMounted(false)
      const opener = openerRef.current
      if (opener && document.contains(opener)) opener.focus()
    }
    if (prefersReducedMotion()) {
      finish()
      return
    }
    dialog
      .animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px) scale(0.98)' }],
        { duration: 160, easing: 'ease-in' },
      )
      .finished.then(finish, finish)
    return () => {
      cancelled = true
    }
  }, [open, mounted])

  if (!mounted) return null

  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && dismissible) onClose()
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className={['modal', size && `modal--${size}`, className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        if (dismissible) onClose()
      }}
      onClick={onBackdropClick}
    >
      <header className="modal__header">
        {Icon && (
          <span className={['modal__icon', tone && `modal__icon--${tone}`].filter(Boolean).join(' ')}>
            <Icon />
          </span>
        )}
        <div className="modal__heading">
          <h2 className="modal__title" id={titleId}>
            {title}
          </h2>
          {description && (
            <p className="modal__description" id={descriptionId}>
              {description}
            </p>
          )}
        </div>
        {dismissible && (
          <Button variant="ghost" size="sm" iconOnly icon={X} className="modal__close" aria-label="Close" onClick={onClose} />
        )}
      </header>
      {children !== undefined && children !== null && <div className="modal__body">{children}</div>}
      {actions && <footer className={['modal__footer', footerSplit && 'modal__footer--split'].filter(Boolean).join(' ')}>{actions}</footer>}
    </dialog>,
    document.body,
  )
}
