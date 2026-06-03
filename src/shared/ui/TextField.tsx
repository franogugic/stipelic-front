import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, id, className, ...inputProps }: TextFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  const hasError = Boolean(error)

  return (
    <div className="grid gap-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={fieldId}
        {...inputProps}
        className={[
          'w-full rounded-xl border px-3.5 py-2.5 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400',
          'focus:ring-2',
          hasError
            ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100'
            : 'border-neutral-200 bg-white focus:border-neutral-400 focus:ring-neutral-100',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className ?? '',
        ].join(' ')}
      />
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-neutral-400">{hint}</p>
      ) : null}
    </div>
  )
}
