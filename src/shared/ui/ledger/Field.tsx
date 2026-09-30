import { CircleAlert } from 'lucide-react'
import { useId } from 'react'
import type { ReactNode } from 'react'

export type FieldControlProps = {
  id: string
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
  id,
  className,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  /** Adds the muted "Optional" tag next to the label. */
  optional?: boolean
  id?: string
  className?: string
  children: (control: FieldControlProps) => ReactNode
}) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const hintId = `${controlId}-hint`
  const errorId = `${controlId}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={['field', className].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={controlId}>
        {label}
        {optional && <> <span className="field__optional">Optional</span></>}
      </label>
      {children({
        id: controlId,
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
