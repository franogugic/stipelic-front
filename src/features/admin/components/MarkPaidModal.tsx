import { CircleAlert, CircleCheck } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../../../shared/api/http-client'
import { dateTime, money } from '../../../shared/lib/format'
import { countryName } from '../../creators/components/payouts/payout-format'
import { Alert, Button, Field, Input, Modal, Money } from '../../../shared/ui/ledger'
import { markPayoutPaid } from '../api/admin-payouts-api'
import { groupIban } from '../model/format'
import type { AdminPayoutQueueItem } from '../model/types'

const FORM_ID = 'paid-form'

/** The summary every admin payout dialog shows, from the prototype's payoutSummary(). */
export function PayoutSummary({ request }: { request: AdminPayoutQueueItem }) {
  return (
    <dl className="kv">
      <dt>Creator</dt>
      <dd>
        {request.creatorName} · {request.creatorSlug}
      </dd>
      <dt>Account holder</dt>
      <dd>{request.accountHolderName}</dd>
      <dt>Amount</dt>
      <dd>
        <Money amountCents={request.amountCents} currency={request.currency} />
      </dd>
      <dt>IBAN</dt>
      <dd className="mono">{groupIban(request.iban)}</dd>
      <dt>Country</dt>
      <dd>{countryName(request.bankCountryCode)}</dd>
      <dt>Requested</dt>
      <dd>{dateTime(request.createdAt)}</dd>
    </dl>
  )
}

/** Confirms a transfer was sent: the bank reference is required (the creator sees it). Mount with a new `key` per opening. */
export function MarkPaidModal({
  request,
  onClose,
  onDone,
}: {
  request: AdminPayoutQueueItem | null
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!request || saving) return
    if (!reference.trim()) {
      setError('Add the bank reference — the creator sees it in their payout history.')
      return
    }
    setError(null)
    setRequestError(null)
    setSaving(true)
    try {
      await markPayoutPaid(request.publicId, { bankReference: reference })
      onDone(`${request.creatorName} · ${money(request.amountCents, request.currency)}`)
    } catch (caught) {
      setRequestError(caught instanceof ApiError ? caught.message : 'We could not mark this payout as paid. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={request !== null}
      onClose={onClose}
      dismissible={!saving}
      title="Mark as paid"
      description={request ? `Confirm you’ve sent ${money(request.amountCents, request.currency)} to ${request.creatorName}.` : undefined}
      icon={CircleCheck}
      tone="accent"
      actions={
        <>
          <Button variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={saving}>
            Mark as paid
          </Button>
        </>
      }
    >
      {request && (
        <form className="form" id={FORM_ID} noValidate onSubmit={(event) => void submit(event)}>
          <PayoutSummary request={request} />
          {requestError && (
            <Alert tone="danger" icon={CircleAlert} live>
              {requestError}
            </Alert>
          )}
          <Field label="Bank reference" error={error ?? undefined} hint={error ? undefined : 'The creator sees it in their payout history.'}>
            {(control) => (
              <Input
                {...control}
                className="mono"
                placeholder="e.g. TRX-20260929-0412"
                autoComplete="off"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            )}
          </Field>
        </form>
      )}
    </Modal>
  )
}
