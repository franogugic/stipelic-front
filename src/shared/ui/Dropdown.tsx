import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// Custom-styled dropdown, standing in for a native <select> — the Figma reference never designs one
// (every select field there is a bare native <select> reusing the text-input box), so this follows
// the same input recipe (bg-secondary / border-border / rounded-lg / text-sm) established across the
// redesigned forms, with a trigger + menu so it can carry a chevron and a check mark for the active
// option. Intended to become the one dropdown used across the app as pages get redesigned — don't
// invent a second variant elsewhere, extend this one.
export type DropdownOption<T extends string> = {
  value: T
  label: string
}

export function Dropdown<T extends string>({
  value,
  onChange,
  options,
  disabled,
  className = '',
}: {
  value: T
  onChange: (value: T) => void
  options: DropdownOption<T>[]
  disabled?: boolean
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-left text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen ? (
        <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border border-border bg-card p-1 shadow-2xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-foreground transition hover:bg-secondary"
            >
              {option.label}
              {option.value === value ? <Check size={14} className="text-accent" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
