import type { ComponentPropsWithRef } from 'react'

export function Input({ className, ...rest }: ComponentPropsWithRef<'input'>) {
  return <input className={['input', className].filter(Boolean).join(' ')} {...rest} />
}
