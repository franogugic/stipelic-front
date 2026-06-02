import type { ComponentPropsWithoutRef } from 'react'

type TextFieldProps = ComponentPropsWithoutRef<'input'> & {
  label: string
  error?: string
}

export function TextField({ label, error, id, className = '', ...props }: TextFieldProps) {
  const inputId = id ?? props.name

  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-900" htmlFor={inputId}>
      <span>{label}</span>
      <input
        className={`h-12 rounded-xl border bg-white px-4 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/10 ${
          error ? 'border-red-300 bg-red-50/50' : 'border-neutral-200'
        } ${className}`}
        id={inputId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <span className="text-xs font-medium text-red-600" id={`${inputId}-error`}>
          {error}
        </span>
      ) : null}
    </label>
  )
}
