import { ArrowDown, ArrowUp, Lock, Trash2 } from 'lucide-react'
import type { MenuItem } from '../../../../shared/ui/ledger'
import type { DraftAction, DraftSection } from '../../model/editor-draft'
import { isMovable } from '../../model/editor-draft'
import { kindOf } from '../../model/section-library'

/** Why a section can't be deleted: Navbar / Footer are locked, and the backend needs one Hero and one CTA. */
export function deleteBlockedReason(section: DraftSection): string | undefined {
  if (section.type === 'Hero') return 'Every page needs a Hero section.'
  if (section.type === 'Cta') return 'Every page needs a Call to action.'
  return undefined
}

/** The row / form menu: move up and down between the navbar and the footer, delete. */
export function sectionMenuItems(
  section: DraftSection,
  sections: DraftSection[],
  dispatch: (action: DraftAction) => void,
  onDelete: (section: DraftSection) => void,
): MenuItem[] {
  const kind = kindOf(section.type)
  if (kind.locked) {
    return [
      { note: `The ${kind.name.toLowerCase()} always stays at the ${kind.locked} of the page. You can edit it, but not move or delete it.`, icon: Lock },
      { label: 'Move up', icon: ArrowUp, disabled: true, onSelect: () => {} },
      { label: 'Move down', icon: ArrowDown, disabled: true, onSelect: () => {} },
      'separator',
      { label: 'Delete section', icon: Trash2, tone: 'danger', disabled: true, onSelect: () => {} },
    ]
  }
  const movable = sections.filter(isMovable)
  const position = movable.indexOf(section)
  const index = sections.indexOf(section)
  return [
    { label: 'Move up', icon: ArrowUp, disabled: position === 0, onSelect: () => dispatch({ type: 'move', key: section.key, toIndex: index - 1 }) },
    { label: 'Move down', icon: ArrowDown, disabled: position === movable.length - 1, onSelect: () => dispatch({ type: 'move', key: section.key, toIndex: index + 1 }) },
    'separator',
    { label: 'Delete section', icon: Trash2, tone: 'danger', disabledReason: deleteBlockedReason(section), onSelect: () => onDelete(section) },
  ]
}
