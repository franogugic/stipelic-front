import { CircleAlert, Clock, Send } from 'lucide-react'
import { number, plural } from '../../../shared/lib/format'
import { Alert, Button, KeyValue, Modal } from '../../../shared/ui/ledger'
import { overDailyQuota, sendingEstimateLine } from '../model/sending-estimate'
import type { AudiencePreview } from '../model/types'

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
  estimate = null,
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
  /** What the audience preview says about this send: skipped contacts, the time it takes, the daily quota. */
  estimate?: AudiencePreview | null
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
  const estimateLine = sendingEstimateLine(estimate)
  const overQuota = overDailyQuota(estimate)
  const details = (
    <div className="stack">
      {estimateLine && (
        <p className="text-sm text-secondary" data-testid="sending-estimate">
          {estimateLine}
        </p>
      )}
      {overQuota !== null && estimate && (
        <Alert tone="warning" icon={Clock} live>
          Only {number(Math.max(0, estimate.quotaRemainingToday ?? 0))} can go out today under the sending quota. The other {number(overQuota)} send after it resets.
        </Alert>
      )}
    </div>
  )
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
      <div className="stack">
        {error && (
          <Alert tone="danger" icon={CircleAlert} live>
            {error}
          </Alert>
        )}
        <KeyValue items={items} />
        {(estimateLine || overQuota !== null) && details}
      </div>
    </Modal>
  )
}
