import { ArrowDown, ArrowUp, ChevronRight, GripVertical, Plus, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Field, Input, Textarea } from '../../../../shared/ui/ledger'
import { useDragReorder } from './use-drag-reorder'

/** A labelled group of fields (the prototype's `group()`): `fieldset.form-group` with a legend and a hint. */
export function FormGroup({ legend, hint, children }: { legend: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="form-group">
      <legend className="field__label">{legend}</legend>
      {children}
      {hint && <p className="field__hint">{hint}</p>}
    </fieldset>
  )
}

/** The editor's neutral callout (the prototype's plain `.alert`, no tone): an icon and a body. */
export function NoteAlert({ icon: Icon, title, children }: { icon: LucideIcon; title?: ReactNode; children: ReactNode }) {
  return (
    <div className="alert">
      <Icon />
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        {children}
      </div>
    </div>
  )
}

/** A text field or, with `rows`, a textarea (the prototype's `textField()`). */
export function TextField({
  label,
  value,
  onChange,
  hint,
  optional,
  placeholder,
  rows,
  maxLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: ReactNode
  optional?: boolean
  placeholder?: string
  rows?: number
  maxLength?: number
}) {
  return (
    <Field label={label} hint={hint} optional={optional}>
      {(control) =>
        rows ? (
          <Textarea {...control} rows={rows} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
        ) : (
          <Input {...control} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
        )
      }
    </Field>
  )
}

export const ALT_TEXT_HINT =
  'Read out by screen readers and shown if the image can’t load. Leave it empty if the image is only decorative.'

export function AltTextField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextField
      label="Alt text"
      optional
      value={value}
      placeholder="Describe what’s in the image"
      hint={ALT_TEXT_HINT}
      maxLength={300}
      onChange={onChange}
    />
  )
}

const move = <T,>(items: T[], from: number, to: number) => {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/**
 * Repeating list content (links, features, quotes…): items open one at a time, reorder by drag or the arrow
 * buttons, and are removed with the bin. `max` disables "Add" with a tooltip and shows the "n of max" footer.
 */
export function Repeater<T>({
  noun,
  items,
  onChange,
  summary,
  renderFields,
  createItem,
  max,
  defaultOpen = 0,
}: {
  noun: string
  items: T[]
  onChange: (items: T[]) => void
  summary: (item: T) => string
  renderFields: (item: T, update: (item: T) => void) => ReactNode
  createItem: () => T
  max: number
  /** The item open at first; -1 for all closed. */
  defaultOpen?: number
}) {
  const baseId = useId()
  const [open, setOpen] = useState(defaultOpen)
  const atMax = items.length >= max
  const drag = useDragReorder((from, to) => {
    onChange(move(items, from, to))
    setOpen(to)
  })

  const reorder = (from: number, to: number) => {
    onChange(move(items, from, to))
    if (open === from) setOpen(to)
    else if (open === to) setOpen(from)
  }

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
    if (open === index) setOpen(-1)
    else if (open > index) setOpen(open - 1)
  }

  return (
    <div className="repeater">
      {items.map((item, index) => {
        const bodyId = `${baseId}-${index}`
        const isOpen = index === open
        const classes = [
          'repeater__item',
          isOpen && 'is-open',
          drag.dragIndex === index && 'is-placeholder',
        ]
        return (
          <div className={classes.filter(Boolean).join(' ')} key={index} {...drag.itemProps(index)}>
            <div className="repeater__head">
              <button
                className="sortable__handle"
                type="button"
                aria-label={`Drag ${noun} ${index + 1} to reorder`}
                data-tooltip="Drag to reorder"
                tabIndex={-1}
                {...drag.handleProps(index)}
              >
                <GripVertical />
              </button>
              <button
                className="repeater__toggle"
                type="button"
                aria-expanded={isOpen}
                aria-controls={bodyId}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                <ChevronRight />
                <span className="repeater__index">{index + 1}</span>
                <span className="repeater__summary">{summary(item) || `New ${noun}`}</span>
              </button>
              <div className="repeater__actions">
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={ArrowUp}
                  aria-label={`Move ${noun} up`}
                  data-tooltip={`Move ${noun} up`}
                  aria-disabled={index === 0}
                  onClick={() => reorder(index, index - 1)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={ArrowDown}
                  aria-label={`Move ${noun} down`}
                  data-tooltip={`Move ${noun} down`}
                  aria-disabled={index === items.length - 1}
                  onClick={() => reorder(index, index + 1)}
                />
                <Button
                  variant="danger-ghost"
                  size="sm"
                  iconOnly
                  icon={Trash2}
                  aria-label={`Remove ${noun}`}
                  data-tooltip={`Remove ${noun}`}
                  onClick={() => remove(index)}
                />
              </div>
            </div>
            <div className="repeater__body" id={bodyId} hidden={!isOpen}>
              {renderFields(item, (next) => onChange(items.map((current, i) => (i === index ? next : current))))}
            </div>
          </div>
        )
      })}
      <button
        className="repeater__add"
        type="button"
        aria-disabled={atMax || undefined}
        data-tooltip={atMax ? `You can add up to ${max} ${noun}s` : undefined}
        onClick={() => {
          if (atMax) return
          onChange([...items, createItem()])
          setOpen(items.length)
        }}
      >
        <Plus />
        <span>Add {noun}</span>
      </button>
      <p className="repeater__foot">
        <span>
          {items.length} of {max} {noun}s
        </span>
        <span>Drag or use the arrows to reorder</span>
      </p>
    </div>
  )
}
