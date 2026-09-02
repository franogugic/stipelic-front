import type { InputHTMLAttributes, ReactNode } from 'react'

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  labelAction?: ReactNode
}

export function AuthField({ label, error, hint, labelAction, id, className, ...inputProps }: AuthFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const hasError = Boolean(error)

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={fieldId} className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </label>
        {labelAction}
      </div>
      <input
        id={fieldId}
        {...inputProps}
        className={[
          'w-full rounded-lg border px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/40',
          'bg-secondary focus:ring-2',
          hasError
            ? 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10'
            : 'border-border focus:border-accent/50 focus:ring-accent/10',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className ?? '',
        ].join(' ')}
      />
      {error ? (
        <p className="text-xs font-medium text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
