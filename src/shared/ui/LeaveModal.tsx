import { TriangleAlert } from 'lucide-react'
import { Button, Modal } from './ledger'

/** "Leave without saving?" — asked when an editor has unsaved changes and the user navigates away. */
export function LeaveModal({
  open,
  title,
  saving,
  onDiscard,
  onKeepEditing,
  onSaveAndLeave,
}: {
  open: boolean
  title: string
  saving: boolean
  onDiscard: () => void
  onKeepEditing: () => void
  onSaveAndLeave: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onKeepEditing}
      dismissible={!saving}
      title="Leave without saving?"
      description={`You have unsaved changes to “${title}”. If you leave now, they’ll be lost.`}
      icon={TriangleAlert}
      tone="warning"
      size="sm"
      actions={
        <>
          <Button variant="danger-ghost" disabled={saving} onClick={onDiscard}>
            Discard changes
          </Button>
          <Button variant="secondary" disabled={saving} onClick={onKeepEditing}>
            Keep editing
          </Button>
          <Button variant="primary" loading={saving} onClick={onSaveAndLeave}>
            Save and leave
          </Button>
        </>
      }
    />
  )
}
