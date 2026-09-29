import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { Card } from './Card'

const FOCUSABLE_INPUT = 'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'

export function Modal({
  open,
  title,
  onClose,
  dismissable = true,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  // When false (e.g. while a request is in flight) Escape, overlay click and the X button are inert.
  dismissable?: boolean
  children: ReactNode
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const dismissableRef = useRef(dismissable)

  useEffect(() => {
    onCloseRef.current = onClose
    dismissableRef.current = dismissable
  })

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const firstInput = dialog?.querySelector<HTMLElement>(FOCUSABLE_INPUT)
    ;(firstInput ?? dialog)?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissableRef.current) onCloseRef.current()
    }
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissable) onClose()
      }}
    >
      <Card className="w-full max-w-md p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="outline-none"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 id={titleId} className="font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.25rem' }}>
              {title}
            </h2>
            {dismissable && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {children}
        </div>
      </Card>
    </div>
  )
}
