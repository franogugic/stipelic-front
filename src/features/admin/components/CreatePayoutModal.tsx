import { CircleAlert, Hourglass, Plus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../../../shared/api/http-client'
import { currencySymbol, money } from '../../../shared/lib/format'
import { parsePriceInput } from '../../../shared/lib/price-input'
import { Alert, Button, Field, Input, InputAddon, InputGroup, Modal, Select, Textarea } from '../../../shared/ui/ledger'
import { createPayout } from '../api/admin-payouts-api'
import type { CreatorBalanceSummary } from '../model/types'

const FORM_ID = 'create-payout-form'

/** Adds a Pending payout for a transfer outside the request flow. Mount with a new `key` per opening. */
export function CreatePayoutModal({
  open,
  balances,
  onClose,
  onDone,
}: {
  open: boolean
  /** Only creators with a payout profile can be paid. */
  balances: CreatorBalanceSummary[]
  onClose: () => void
  onDone: () => void
}) {
  const eligible = balances.filter((balance) => balance.hasPayoutProfile)
  const [creatorId, setCreatorId] = useState(eligible[0]?.creatorPublicId ?? '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [amountError, setAmountError] = useState<string | null>(null)
  const [creatorError, setCreatorError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const selected = eligible.find((balance) => balance.creatorPublicId === creatorId)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    setRequestError(null)
    if (!selected) {
      setCreatorError('Choose a creator with bank details.')
      return
    }
    setCreatorError(null)
    const parsed = parsePriceInput(amount, 'Enter the amount to pay out.')
    if (!parsed.ok || parsed.cents <= 0) {
      setAmountError(parsed.ok ? 'Enter an amount above zero.' : parsed.error)
      return
    }
    if (parsed.cents > selected.balanceCents) {
      setAmountError(`The most you can pay out is ${money(selected.balanceCents, selected.currency)} (the creator’s balance).`)
      return
    }
    setAmountError(null)

    setSaving(true)
    try {
      await createPayout({ creatorPublicId: selected.creatorPublicId, amountCents: parsed.cents, currency: selected.currency, note })
      onDone()
    } catch (caught) {
      // Pending payout already open, insufficient balance, below the minimum…: the API's own wording.
      setRequestError(caught instanceof ApiError ? caught.message : 'We could not create this payout. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!saving}
      title="Create payout manually"
      description="Adds a pending payout for a transfer outside the request flow — for example after a support ticket."
      icon={Plus}
      actions={
        <>
          <Button variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={saving}>
            Create pending payout
          </Button>
        </>
      }
    >
      <form className="form" id={FORM_ID} noValidate onSubmit={(event) => void submit(event)}>
        {requestError && (
          <Alert tone="danger" icon={CircleAlert} live>
            {requestError}
          </Alert>
        )}
        <Field label="Creator" error={creatorError ?? undefined}>
          {(control) => (
            <Select {...control} value={creatorId} onChange={(event) => setCreatorId(event.target.value)}>
              {eligible.length === 0 && <option value="">No creator has bank details yet</option>}
              {eligible.map((balance) => (
                <option key={balance.creatorPublicId} value={balance.creatorPublicId}>
                  {balance.name} — balance {money(balance.balanceCents, balance.currency)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          label="Amount"
          error={amountError ?? undefined}
          hint={amountError || !selected ? undefined : `Up to ${money(selected.balanceCents, selected.currency)} (the creator’s balance).`}
        >
          {(control) => (
            <InputGroup>
              <InputAddon>{currencySymbol(selected?.currency ?? 'EUR')}</InputAddon>
              <Input
                {...control}
                className="num"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0.00"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </InputGroup>
          )}
        </Field>
        <Field label="Note" optional hint="Shown in the payout history.">
          {(control) => (
            <Textarea
              {...control}
              rows={3}
              placeholder="e.g. Requested by email, support ticket #482"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          )}
        </Field>
        <Alert tone="info" icon={Hourglass}>
          It joins the queue as <strong>Pending</strong>. Send the transfer, then use <strong>Mark as paid</strong> with the
          bank reference.
        </Alert>
      </form>
    </Modal>
  )
}
