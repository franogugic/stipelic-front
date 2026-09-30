import type { InputHTMLAttributes, ReactNode } from 'react'

/** Radio / checkbox card. `visual` (usually a Badge) is shown above the title. Controlled. */
export function Choice({
  visual,
  title,
  text,
  type = 'radio',
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'title'> & {
  visual?: ReactNode
  title: ReactNode
  text?: ReactNode
  type?: 'radio' | 'checkbox'
}) {
  return (
    <label className={['choice', className].filter(Boolean).join(' ')}>
      <input className="choice__input" type={type} {...rest} />
      {visual}
      <span className="choice__title">{title}</span>
      {text && <span className="choice__text">{text}</span>}
    </label>
  )
}
