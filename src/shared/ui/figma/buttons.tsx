import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  // Leading icon; replaced by a spinner while `loading`.
  icon?: ReactNode
  className?: string
}

function LeadingVisual({ loading, icon }: { loading?: boolean; icon?: ReactNode }) {
  if (loading) return <Loader2 className="animate-spin" size={14} />
  return <>{icon}</>
}

export function PrimaryBtn({
  children,
  onClick,
  type = 'button',
  disabled,
  loading,
  icon,
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={{ backgroundColor: 'var(--color-chart-1)' }}
    >
      <LeadingVisual loading={loading} icon={icon} />
      {children}
    </button>
  )
}

export function GhostBtn({
  children,
  onClick,
  type = 'button',
  disabled,
  loading,
  icon,
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <LeadingVisual loading={loading} icon={icon} />
      {children}
    </button>
  )
}
