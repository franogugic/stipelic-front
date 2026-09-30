import type { InputHTMLAttributes, ReactNode } from 'react'

/** Toggle switch: `.switch-field` label around a checkbox with `role="switch"`. Controlled. */
export function Switch({
  label,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> & { label: ReactNode }) {
  return (
    <label className={['switch-field', className].filter(Boolean).join(' ')}>
      <input className="switch" type="checkbox" role="switch" {...rest} />
      <span>{label}</span>
    </label>
  )
}
