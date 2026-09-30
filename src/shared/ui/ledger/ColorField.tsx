const HEX = /^#[0-9a-f]{6}$/i

/**
 * Colour swatch + hex input kept in sync. Controlled: `value` is the hex text as typed; the swatch follows
 * it while it is a complete `#rrggbb` value.
 */
export function ColorField({
  id,
  value,
  onChange,
  'aria-label': ariaLabel = 'Colour hex value',
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  'aria-label'?: string
}) {
  return (
    <div className="color-field">
      <input
        className="color-field__swatch"
        id={id}
        type="color"
        value={HEX.test(value) ? value.toLowerCase() : '#000000'}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
      />
      <input
        className="input mono"
        type="text"
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
