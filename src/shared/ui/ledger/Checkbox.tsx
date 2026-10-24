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
        {/* One flex item, so links inside the label stay in the line of text instead of each becoming a block. */}
        <span>{label}</span>
        {hint && <span className="check__hint">{hint}</span>}
      </span>
    </label>
  )
}
