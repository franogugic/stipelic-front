import { createContext, useContext } from 'react'

export type ToastOptions = {
  title: string
  message?: string
  tone?: 'success' | 'danger' | 'info'
  /** Milliseconds before it dismisses itself; 0 keeps it until dismissed. */
  duration?: number
}

export type ToastHandle = { dismiss: () => void }

export const ToastContext = createContext<((options: ToastOptions) => ToastHandle) | null>(null)

/** Returns `toast(options)`. Needs a `ToastProvider` above it. */
export function useToast() {
  const toast = useContext(ToastContext)
  if (!toast) throw new Error('useToast must be used inside <ToastProvider>')
  return toast
}
