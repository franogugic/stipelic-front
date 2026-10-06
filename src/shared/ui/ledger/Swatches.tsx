import type { CSSProperties } from 'react'
import { useId } from 'react'

/**
 * Suggested colours as a radio group of round chips (the prototype's `.swatches`). Controlled: the chip whose hex
 * equals `value` (ignoring case) is checked; none is when the value is a custom colour.
 */
export function Swatches({
  label,
  options,
  value,
  onChange,
  name,
}: {
  /** Accessible name of the group. */
  label: string
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
  name?: string
}) {
  const generatedName = useId()
  const groupName = name ?? generatedName
  return (
    <div className="swatches" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label className="swatches__option" data-tooltip={option.label} key={option.value}>
          <input
            type="radio"
            name={groupName}
            value={option.value}
            aria-label={option.label}
            checked={option.value.toLowerCase() === value.toLowerCase()}
            onChange={() => onChange(option.value)}
          />
          <span className="swatches__chip" style={{ '--swatch': option.value } as CSSProperties} />
        </label>
      ))}
    </div>
  )
}
