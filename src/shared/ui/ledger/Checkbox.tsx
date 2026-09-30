import type { InputHTMLAttributes, ReactNode } from 'react'

/**
 * `.check` label around a native checkbox (or radio, via `type="radio"`). Controlled: pass `checked` and
 * `onChange`. `hint` adds the muted second line.
 */
export function Checkbox({
  label,
  hint,
  type = 'checkbox',
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  hint?: ReactNode
  type?: 'checkbox' | 'radio'
}) {
  return (
    <label className={['check', className].filter(Boolean).join(' ')}>
      <input className="check__input" type={type} {...rest} />
      <span className="check__text">
        {hint ? (
          <>
            <span>{label}</span>
            <span className="check__hint">{hint}</span>
          </>
        ) : (
          label
        )}
      </span>
    </label>
  )
}
