import { GripVertical, Lock, Plus } from 'lucide-react'
import { Fragment, useEffect, useId, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Button, Menu } from '../../../../shared/ui/ledger'
import type { DraftAction, DraftSection } from '../../model/editor-draft'
import { isMovable } from '../../model/editor-draft'
import { sectionHref } from '../../model/section-content'
import { kindOf, variantName } from '../../model/section-library'
import type { SectionTemplate } from '../../model/types'
import { sectionMenuItems } from './section-menu'
import { useDragReorder } from './use-drag-reorder'

/**
 * The page's sections in order (the prototype's sortable list). Rows select a section; the handle reorders by
 * drag, or from the keyboard: Space picks the section up, the arrow keys move it, Space drops it, Esc puts it back.
 * The navbar and footer are locked in place.
 */
export function SectionsCard({
  sections,
  selectedKey,
  templates,
  dispatch,
  onAdd,
  onDelete,
  onDragTarget,
}: {
  sections: DraftSection[]
  selectedKey: string | null
  templates: SectionTemplate[]
  dispatch: (action: DraftAction) => void
  onAdd: () => void
  onDelete: (section: DraftSection) => void
  /** While dragging: the section the dragged one would land after, for the preview's drop marker. */
  onDragTarget: (target: { draggedKey: string; afterKey: string } | null) => void
}) {
  const titleId = useId()
  const [picked, setPicked] = useState<{ key: string; from: number } | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const moveTo = (from: number, to: number) => {
    const section = sections[from]
    if (section) dispatch({ type: 'move', key: section.key, toIndex: to })
  }
  const drag = useDragReorder(moveTo)

  const dragged = drag.dragIndex !== null ? sections[drag.dragIndex] : null
  const dropAfter = drag.dropIndex !== null && drag.dropIndex > 0 ? sections[drag.dropIndex - 1] : null
  const draggedKey = dragged?.key ?? null
  const afterKey = dropAfter && dropAfter.key !== draggedKey ? dropAfter.key : null

  // The preview shows where the dragged section will land.
  useEffect(() => {
    onDragTarget(draggedKey && afterKey ? { draggedKey, afterKey } : null)
  }, [draggedKey, afterKey, onDragTarget])

  const name = (section: DraftSection) => kindOf(section.type).name
  const position = (key: string) => `Position ${sections.findIndex((section) => section.key === key) + 1} of ${sections.length}.`

  const onHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, section: DraftSection, index: number) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      if (picked) {
        setPicked(null)
        setAnnouncement(`${name(section)} dropped. ${position(section.key)}`)
      } else {
        setPicked({ key: section.key, from: index })
        setAnnouncement(`${name(section)} picked up. ${position(section.key)} Use the arrow keys to move, space to drop, escape to cancel.`)
      }
      return
    }
    if (!picked || picked.key !== section.key) return
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const to = index + (event.key === 'ArrowUp' ? -1 : 1)
      const target = sections[to]
      if (!target || !isMovable(target)) return
      moveTo(index, to)
      setAnnouncement(`${name(section)} moved. Position ${to + 1} of ${sections.length}.`)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      moveTo(index, picked.from)
      setPicked(null)
      setAnnouncement(`Move cancelled. ${name(section)} is back at position ${picked.from + 1} of ${sections.length}.`)
    }
  }

  const subtitle = dragged && dropAfter
    ? `Moving “${name(dragged)}” — drop it after ${name(dropAfter)}`
    : `${sections.length} sections · drag to reorder`

  return (
    <section className="card" aria-labelledby={titleId}>
      <div className="card__header">
        <div className="card__heading">
          <h2 className="card__title" id={titleId}>
            Sections
          </h2>
          <p className="card__subtitle">{subtitle}</p>
        </div>
        <Button variant="ghost" size="sm" iconOnly icon={Plus} aria-label="Add section" data-tooltip="Add section" onClick={onAdd} />
      </div>
      <div className="card__body">
        <ol className="sortable" aria-label="Page sections, in order">
          {sections.map((section, index) => {
            const kind = kindOf(section.type)
            const Icon = kind.icon
            const active = section.key === selectedKey
            const classes = [
              'sortable__item',
              active && 'is-active',
              kind.locked && 'is-locked',
              drag.dragIndex === index && 'is-placeholder',
              picked?.key === section.key && 'is-dragging',
            ]
            const showDrop =
              drag.dragIndex !== null && drag.dropIndex === index && index !== drag.dragIndex && index !== drag.dragIndex + 1
            return (
              <Fragment key={section.key}>
                {showDrop && <li className="sortable__drop" aria-hidden="true" />}
                <li
                  className={classes.filter(Boolean).join(' ')}
                  {...(kind.locked ? {} : drag.itemProps(index))}
                >
                  {kind.locked ? (
                    <button
                      className="sortable__handle"
                      type="button"
                      aria-disabled="true"
                      aria-label={`${kind.name} is locked to the ${kind.locked}`}
                      data-tooltip={`Locked — always at the ${kind.locked}`}
                    >
                      <Lock />
                    </button>
                  ) : (
                    <button
                      className="sortable__handle"
                      type="button"
                      aria-label={`Move ${kind.name}: press space to pick up, arrow keys to move`}
                      aria-pressed={picked?.key === section.key}
                      data-tooltip="Drag to reorder"
                      {...drag.handleProps(index)}
                      onKeyDown={(event) => onHandleKeyDown(event, section, index)}
                      onBlur={() => {
                        if (picked?.key === section.key) setPicked(null)
                      }}
                    >
                      <GripVertical />
                    </button>
                  )}
                  <a
                    className="sortable__main"
                    href={sectionHref(section.key)}
                    aria-current={active ? 'true' : undefined}
                    onClick={(event) => {
                      event.preventDefault()
                      dispatch({ type: 'select', key: section.key })
                    }}
                  >
                    <span className="sortable__icon">
                      <Icon />
                    </span>
                    <span className="sortable__text">
                      <span className="sortable__title">{kind.name}</span>
                      <span className="sortable__meta">{variantName(templates, section.type, section.variant)}</span>
                    </span>
                  </a>
                  <Menu label={`Actions for ${kind.name}`} items={sectionMenuItems(section, sections, dispatch, onDelete)} />
                </li>
              </Fragment>
            )
          })}
        </ol>
        <p className="sr-only" role="status">
          {announcement}
        </p>
        <Button variant="secondary" block icon={Plus} className="editor__add" onClick={onAdd}>
          Add section
        </Button>
      </div>
    </section>
  )
}
