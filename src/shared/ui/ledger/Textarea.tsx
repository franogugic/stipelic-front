import type { ComponentPropsWithRef } from 'react'

export function Textarea({ className, ...rest }: ComponentPropsWithRef<'textarea'>) {
  return <textarea className={['textarea', className].filter(Boolean).join(' ')} {...rest} />
}
