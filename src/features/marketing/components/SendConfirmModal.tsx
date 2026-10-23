import { CircleAlert, Send } from 'lucide-react'
import { number, plural } from '../../../shared/lib/format'
import { Alert, Button, KeyValue, Modal } from '../../../shared/ui/ledger'

/** "Send to N subscribers (or buyers)?" — the last look before an immediate send. */
export function SendConfirmModal({
  open,
  recipientCount,
  subject,
  audienceTitle,
  from,
  sendsLeftAfter,
  busy,
  error,
  resend,
  noun = 'subscriber',
  onCancel,
  onConfirm,
}: {
  open: boolean
  recipientCount: number
  subject: string
  audienceTitle: string
  /** "Brand <support@…>"; the row is left out without a support email. */
  from: string | null
  /** Null for an unlimited plan. */
  sendsLeftAfter: number | null
  busy: boolean
  error: string | null
  /** A resend to non-openers: which one it is ("Resend 2 of 5"). */
  resend?: { round: number; limit: number }
  /** Who gets it: subscribers, or the buyers of a page. */
  noun?: 'subscriber' | 'buyer'
  onCancel: () => void
  onConfirm: () => void
}) {
  const items = [
    { term: 'Subject', description: subject },
    { term: 'Audience', description: audienceTitle },
    ...(resend ? [{ term: 'Resend', description: `${resend.round} of ${resend.limit}` }] : []),
    ...(from ? [{ term: 'From', description: from }] : []),
    ...(sendsLeftAfter === null ? [] : [{ term: 'Sends left after', description: `${number(sendsLeftAfter)} this month` }]),
  ]
  return (
    <Modal
      open={open}
      onClose={onCancel}
      dismissible={!busy}
      size="sm"
      title={resend ? `Resend to ${plural(recipientCount, 'person', 'people')}?` : `Send to ${plural(recipientCount, noun)}?`}
      description="It goes out right away and can’t be stopped once sending finishes."
      icon={Send}
      tone="accent"
      actions={
        <>
          <Button variant="secondary" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="accent" icon={Send} loading={busy} onClick={onConfirm}>
            {resend ? 'Resend now' : 'Send now'}
          </Button>
        </>
      }
    >
      {error ? (
        <div className="stack">
          <Alert tone="danger" icon={CircleAlert} live>
            {error}
          </Alert>
          <KeyValue items={items} />
        </div>
      ) : (
        <KeyValue items={items} />
      )}
    </Modal>
  )
}
