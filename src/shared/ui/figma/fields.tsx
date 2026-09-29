import { useId } from 'react'
import type { ReactNode } from 'react'

const LABEL_CLASS = 'block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5'
const FIELD_CLASS =
  'w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-secondary text-foreground placeholder:text-muted-foreground/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40'

export function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  maxLength,
  disabled,
  name,
  autoComplete,
  className = '',
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  error?: string
  maxLength?: number
  disabled?: boolean
  name?: string
  autoComplete?: string
  className?: string
}) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={FIELD_CLASS}
      />
      {error && (
        <p id={errorId} className="text-xs mt-1.5" style={{ color: 'var(--color-chart-4)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export function SelectInput({
  variant = 'field',
  label,
  value,
  onChange,
  disabled,
  name,
  className = '',
  children,
}: {
  variant?: 'field' | 'compact'
  label?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  name?: string
  className?: string
  children: ReactNode
}) {
  const id = useId()
  const select = (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{ appearance: 'none' }}
      className={
        variant === 'compact'
          ? 'px-3 py-2 rounded-lg border border-border text-xs bg-secondary text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-40'
          : 'w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-secondary text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-40'
      }
    >
      {children}
    </select>
  )
  if (!label) return className ? <div className={className}>{select}</div> : select
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      {select}
    </div>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
  maxLength,
  disabled,
  name,
  className = '',
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  disabled?: boolean
  name?: string
  className?: string
}) {
  const id = useId()
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={`${FIELD_CLASS} resize-none`}
      />
    </div>
  )
}
