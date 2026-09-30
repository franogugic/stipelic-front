import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import { ToastContext } from './toast-context'
import type { ToastHandle, ToastOptions } from './toast-context'

const MAX_VISIBLE = 3
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// The CSS names the danger tone `toast--error`.
const TONE_CLASS = { success: 'success', danger: 'error', info: 'info' } as const
const TONE_ICON = { success: CircleCheck, danger: CircleAlert, info: Info } as const

type ToastEntry = Required<Pick<ToastOptions, 'title' | 'tone' | 'duration'>> & { id: number; message?: string; leaving: boolean }

/**
 * Mount once at the app root, then call `useToast()` anywhere. The region announces politely
 * (`aria-live="polite"`), shows at most three toasts (the oldest is dropped), pauses the timer while a
 * toast is hovered or focused, and removes toasts immediately under reduced motion.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const nextId = useRef(0)

  const remove = useCallback((id: number) => setToasts((current) => current.filter((entry) => entry.id !== id)), [])
  const startLeaving = useCallback(
    (id: number) => {
      if (prefersReducedMotion()) {
        remove(id)
        return
      }
      setToasts((current) => current.map((entry) => (entry.id === id ? { ...entry, leaving: true } : entry)))
    },
    [remove],
  )

  const toast = useCallback(
    ({ title, message, tone = 'success', duration = 4500 }: ToastOptions): ToastHandle => {
      nextId.current += 1
      const id = nextId.current
      setToasts((current) => [...current, { id, title, message, tone, duration, leaving: false }].slice(-MAX_VISIBLE))
      return { dismiss: () => startLeaving(id) }
    },
    [startLeaving],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toasts.length > 0 &&
        createPortal(
          <section className="toast-region" aria-label="Notifications" aria-live="polite">
            {toasts.map((entry) => (
              <Toast key={entry.id} entry={entry} onDismiss={startLeaving} onRemove={remove} />
            ))}
          </section>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

function Toast({
  entry,
  onDismiss,
  onRemove,
}: {
  entry: ToastEntry
  onDismiss: (id: number) => void
  onRemove: (id: number) => void
}) {
  const [paused, setPaused] = useState(false)
  const Icon = TONE_ICON[entry.tone]

  useEffect(() => {
    if (paused || entry.leaving || entry.duration <= 0) return
    const timer = setTimeout(() => onDismiss(entry.id), entry.duration)
    return () => clearTimeout(timer)
  }, [paused, entry.leaving, entry.duration, entry.id, onDismiss])

  return (
    <div
      className={['toast', `toast--${TONE_CLASS[entry.tone]}`, entry.leaving && 'is-leaving'].filter(Boolean).join(' ')}
      role={entry.tone === 'danger' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onAnimationEnd={() => {
        if (entry.leaving) onRemove(entry.id)
      }}
    >
      <span className="toast__icon">
        <Icon />
      </span>
      <div>
        <p className="toast__title">{entry.title}</p>
        {entry.message && <p className="toast__message">{entry.message}</p>}
      </div>
      <Button variant="ghost" size="sm" iconOnly icon={X} className="toast__close" aria-label="Dismiss notification" onClick={() => onDismiss(entry.id)} />
    </div>
  )
}
