import type { SelectHTMLAttributes } from 'react'

/** Native select in the `.select-wrap` shell (the chevron is drawn by the CSS). */
export function Select({
  size,
  className,
  children,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & { size?: 'sm' }) {
  return (
    <span className="select-wrap">
      <select className={['select', size && `select--${size}`, className].filter(Boolean).join(' ')} {...rest}>
        {children}
      </select>
    </span>
  )
}
