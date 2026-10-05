import { CircleAlert, Landmark } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Field, Input, Modal, Select } from '../../../../shared/ui/ledger'
import { usePayoutStore } from '../../model/payout-store'
import type { PayoutProfile } from '../../model/types'
import { countryName, isPlausibleIban } from './payout-format'

const FORM_ID = 'bank-form'

/** Add or edit the bank account payouts go to. Mount it with a new `key` per opening so it starts fresh. */
export function BankDetailsModal({
  open,
  slug,
  profile,
  defaultCountry,
  onClose,
  onSaved,
}: {
  open: boolean
  slug: string
  profile: PayoutProfile | null
  defaultCountry: string
  onClose: () => void
  onSaved: (profile: PayoutProfile) => void
}) {
  const countries = usePayoutStore((s) => s.payoutCountries)
  const loadCountries = usePayoutStore((s) => s.loadPayoutCountries)
  const saveProfile = usePayoutStore((s) => s.savePayoutProfile)

  const [holder, setHolder] = useState(profile?.accountHolderName ?? '')
  const [iban, setIban] = useState('')
  const [country, setCountry] = useState(profile?.bankCountryCode ?? defaultCountry)
  const [errors, setErrors] = useState<{ holder?: string; iban?: string }>({})
  const [requestError, setRequestError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void loadCountries()
  }, [loadCountries])

  const options = useMemo(() => {
    const codes = new Set(countries.filter((entry) => entry.payoutMode === 'BankTransfer').map((entry) => entry.code))
    if (country) codes.add(country)
    return [...codes].map((code) => ({ code, name: countryName(code) })).sort((a, b) => a.name.localeCompare(b.name))
  }, [countries, country])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    const found: { holder?: string; iban?: string } = {}
    if (!holder.trim()) found.holder = 'Enter the name exactly as it appears on the bank account.'
    if (!iban.trim()) found.iban = profile ? 'Enter the full IBAN to save the changes.' : 'Enter your IBAN.'
    else if (!isPlausibleIban(iban)) found.iban = 'This doesn’t look like a valid IBAN. Check the digits and try again.'
    setErrors(found)
    setRequestError(null)
    if (found.holder || found.iban) return

    setSaving(true)
    const saved = await saveProfile(slug, { accountHolderName: holder, iban, bankCountryCode: country.toUpperCase() })
    setSaving(false)
    if (saved) onSaved(saved)
    else setRequestError(usePayoutStore.getState().updatePayoutProfileError ?? 'We could not save your bank details. Please try again.')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!saving}
      title={profile ? 'Edit bank details' : 'Add bank details'}
      description="We pay your earnings to this account. It must be in your name."
      icon={Landmark}
      actions={
        <>
          <Button variant="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={saving}>
            Save bank details
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
        <Field label="Account holder" hint="Exactly as it appears on the account." error={errors.holder}>
          {(control) => (
            <Input {...control} value={holder} autoComplete="name" onChange={(event) => setHolder(event.target.value)} />
          )}
        </Field>
        <Field
          label="IBAN"
          hint={profile ? `Now ${profile.maskedIban}. Enter the full IBAN to change anything; after saving, only the last four digits are shown.` : 'After saving, only the last four digits are shown.'}
          error={errors.iban}
        >
          {(control) => (
            <Input
              {...control}
              className="mono"
              value={iban}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setIban(event.target.value)}
            />
          )}
        </Field>
        <Field label="Bank country">
          {(control) => (
            <Select {...control} value={country} onChange={(event) => setCountry(event.target.value)}>
              {options.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </form>
    </Modal>
  )
}
