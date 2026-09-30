import { useId } from 'react'

/** Radio group styled as a segmented control. Controlled. */
export function Segmented({
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
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label className="segmented__option" key={option.value}>
          <input
            type="radio"
            name={groupName}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
          />
          <span className="segmented__label">{option.label}</span>
        </label>
      ))}
    </div>
  )
}
