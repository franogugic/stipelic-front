import { CircleHelp, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

/**
 * Confirmation for irreversible actions. `requireText` keeps Confirm disabled until that exact text is
 * typed; `busy` shows a spinner on Confirm and makes the dialog non-dismissible.
 */
export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  icon,
  requireText,
  busy,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean
  title: ReactNode
  text?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'warning'
  icon?: LucideIcon
  requireText?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
  /** Extra content under the text, e.g. an error that keeps the dialog open. */
  children?: ReactNode
}) {
  const inputId = useId()
  const [typed, setTyped] = useState('')
  const [wasOpen, setWasOpen] = useState(open)

  // Start from an empty field every time the dialog opens.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setTyped('')
  }

  const matches = !requireText || typed.trim() === requireText

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={text}
      icon={icon ?? (tone === 'danger' ? TriangleAlert : CircleHelp)}
      tone={tone}
      size="sm"
      dismissible={!busy}
      actions={
        <>
          <Button variant="secondary" disabled={busy} onClick={onCancel} data-autofocus={requireText ? undefined : ''}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={busy}
            aria-disabled={matches ? undefined : true}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {requireText || children ? (
        <>
          {requireText && (
            <div className="field">
              <label className="field__label" htmlFor={inputId}>
                <span>
                  Type <strong className="mono">{requireText}</strong> to confirm
                </span>
              </label>
              <input
                className="input"
                id={inputId}
                type="text"
                autoComplete="off"
                spellCheck={false}
                data-autofocus
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
              />
            </div>
          )}
          {children}
        </>
      ) : undefined}
    </Modal>
  )
}
