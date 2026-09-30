import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

export function SearchInput({ className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <div className="search">
      <Search />
      <input className={['input', className].filter(Boolean).join(' ')} type="search" {...rest} />
    </div>
  )
}
