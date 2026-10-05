import { CircleAlert, CircleX } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../../../shared/api/http-client'
import { money } from '../../../shared/lib/format'
import { Alert, Button, Field, Modal, Textarea } from '../../../shared/ui/ledger'
import { markPayoutFailed } from '../api/admin-payouts-api'
import { groupIban } from '../model/format'
import type { AdminPayoutQueueItem } from '../model/types'

const FORM_ID = 'failed-form'

/** Common reasons fill the textarea; "Other" clears it. */
const REASONS: Array<[string, string]> = [
  ['IBAN rejected', 'The bank rejected the transfer: the IBAN isn’t valid or isn’t accepted.'],
  ['Name mismatch', 'The bank rejected the transfer: the account holder name doesn’t match.'],
  ['Account closed', 'The bank rejected the transfer: the account is closed.'],
  ['Other', ''],
]

/** Marks a payout failed; the amount goes back to the creator's balance. Mount with a new `key` per opening. */
export function MarkFailedModal({
  request,
  onClose,
  onDone,
}: {
  request: AdminPayoutQueueItem | null
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!request || saving) return
    setRequestError(null)
    setSaving(true)
    try {
      await markPayoutFailed(request.publicId, { note: reason })
      onDone()
    } catch (caught) {
      setRequestError(caught instanceof ApiError ? caught.message : 'We could not mark this payout as failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={request !== null}
      onClose={onClose}
      dismissible={!saving}
      title="Mark as failed"
      description={request ? `${money(request.amountCents, request.currency)} goes back to ${request.creatorName}’s balance.` : undefined}
      icon={CircleX}
      tone="danger"
      actions={
        <>
          <Button variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" form={FORM_ID} loading={saving}>
            Mark as failed
          </Button>
        </>
      }
    >
      {request && (
        <form className="form" id={FORM_ID} noValidate onSubmit={(event) => void submit(event)}>
          <dl className="kv">
            <dt>Creator</dt>
            <dd>{request.creatorName}</dd>
            <dt>IBAN</dt>
            <dd className="mono">{groupIban(request.iban)}</dd>
          </dl>
          {requestError && (
            <Alert tone="danger" icon={CircleAlert} live>
              {requestError}
            </Alert>
          )}
          <div className="stack stack--xs">
            <span className="field__label">Common reasons</span>
            <div className="cluster cluster--sm">
              {REASONS.map(([label, text]) => (
                <button className="chip" type="button" aria-pressed={reason === text} key={label} onClick={() => setReason(text)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Reason" hint="The creator sees this reason.">
            {(control) => <Textarea {...control} rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />}
          </Field>
        </form>
      )}
    </Modal>
  )
}
