import { CircleAlert } from 'lucide-react'
import { useId } from 'react'
import type { ReactNode } from 'react'

export type FieldControlProps = {
  id: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

/**
 * Label + control + hint + error. The control is a render prop so the generated ids connect: the label
 * points at the control, and the hint and error are linked to it with `aria-describedby`.
 */
export function Field({
  label,
  hint,
  error,
  optional,
  labelAction,
  id,
  className,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  /** Adds the muted "Optional" tag next to the label. */
  optional?: boolean
  /**
   * Shown at the end of the label row, e.g. a "Forgot password?" link. The row then becomes a
   * `span.field__label` holding the label text in a `<span>` (prototype markup), and the control is
   * named with `aria-labelledby` instead of a `<label>`, so the action never lands in its name.
   */
  labelAction?: ReactNode
  id?: string
  className?: string
  children: (control: FieldControlProps) => ReactNode
}) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const hintId = `${controlId}-hint`
  const errorId = `${controlId}-error`
  const labelId = `${controlId}-label`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      {labelAction ? (
        <span className="field__label">
          <span id={labelId}>
            {label}
            {optional && <> <span className="field__optional">Optional</span></>}
          </span>
          {labelAction}
        </span>
      ) : (
        <label className="field__label" htmlFor={controlId}>
          {label}
          {optional && <> <span className="field__optional">Optional</span></>}
        </label>
      )}
      {children({
        id: controlId,
        'aria-labelledby': labelAction ? labelId : undefined,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId}>
          <CircleAlert />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
