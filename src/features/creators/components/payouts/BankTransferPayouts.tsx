import { Banknote, CircleCheck, Hourglass, Landmark, Pencil, Plus, Receipt, Undo2, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { currencySymbol, date, money } from '../../../../shared/lib/format'
import { formatPriceInput, parsePriceInput } from '../../../../shared/lib/price-input'
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  InputAddon,
  InputGroup,
  Metric,
  Money,
  PageHeader,
  SkeletonCards,
  SkeletonRows,
  StatusBadge,
  payoutStatusKey,
  useToast,
} from '../../../../shared/ui/ledger'
import { useCreatorStore } from '../../model/creator-store'
import { usePayoutStore } from '../../model/payout-store'
import type { Creator } from '../../model/types'
import { BankDetailsModal } from './BankDetailsModal'
import { countryName } from './payout-format'

/** Payouts for a bank-transfer workspace: the balance, a payout request, the bank account and the history. */
export function BankTransferPayouts({ slug, creator }: { slug: string; creator: Creator }) {
  const toast = useToast()

  const summary = usePayoutStore((s) => s.payoutSummary)
  const summaryStatus = usePayoutStore((s) => s.payoutSummaryStatus)
  const history = usePayoutStore((s) => s.payoutHistory)
  const historyStatus = usePayoutStore((s) => s.payoutHistoryStatus)
  const profile = usePayoutStore((s) => s.payoutProfile)
  const profileStatus = usePayoutStore((s) => s.payoutProfileStatus)
  const loadSummary = usePayoutStore((s) => s.loadPayoutSummary)
  const loadHistory = usePayoutStore((s) => s.loadPayoutHistory)
  const loadProfile = usePayoutStore((s) => s.loadPayoutProfile)
  const requestPayout = usePayoutStore((s) => s.requestPayoutForSlug)
  const cancelRequest = usePayoutStore((s) => s.cancelPayoutRequestForSlug)

  const [amountInput, setAmountInput] = useState<string | null>(null)
  const [amountTouched, setAmountTouched] = useState(false)
  const [confirmCents, setConfirmCents] = useState<number | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [justRequested, setJustRequested] = useState<number | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [bankKey, setBankKey] = useState(0)
  const [bankOpen, setBankOpen] = useState(false)

  const refresh = () => {
    void loadSummary(slug)
    void loadHistory(slug)
    void loadProfile(slug)
  }

  // Balances change server-side (sales, payouts), so every visit and every return to the tab refetches.
  useEffect(() => {
    refresh()
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const loading =
    summaryStatus === 'idle' || summaryStatus === 'loading' || profileStatus === 'idle' || profileStatus === 'loading'
  const failed = summaryStatus === 'error' || profileStatus === 'error'

  if (loading) {
    return (
      <>
        <PageHeader title={<em>Payouts</em>} subtitle="Your earnings are collected here — request a transfer to your bank any time." />
        <div className="stack stack--lg">
          <SkeletonCards count={3} />
          <SkeletonRows count={4} />
        </div>
      </>
    )
  }
  if (failed || !summary) {
    return (
      <>
        <PageHeader title={<em>Payouts</em>} subtitle="Your earnings are collected here — request a transfer to your bank any time." />
        <ErrorState onRetry={refresh} />
      </>
    )
  }

  const currency = summary.currency
  const available = summary.balanceCents
  const minimum = summary.minPayoutCents
  const pending = summary.pendingRequest
  const noBank = !profile
  const canRequest = !pending && !noBank && available >= minimum
  const requestTip = noBank
    ? 'Add your bank details first'
    : pending
      ? 'You already have a request waiting'
      : available < minimum
        ? `The minimum payout is ${money(minimum, currency)}`
        : undefined

  const amountText = amountInput ?? formatPriceInput(available)
  const parsed = parsePriceInput(amountText, 'Enter the amount to pay out.')
  const amountError = !parsed.ok
    ? parsed.error
    : parsed.cents < minimum
      ? `The minimum payout is ${money(minimum, currency)}.`
      : parsed.cents > available
        ? `You can request up to ${money(available, currency)}.`
        : undefined

  const askRequest = () => {
    setAmountTouched(true)
    if (!canRequest || amountError || !parsed.ok) return
    setConfirmCents(parsed.cents)
  }

  const confirmRequest = async () => {
    if (confirmCents === null) return
    setRequesting(true)
    const payout = await requestPayout(slug, confirmCents)
    setRequesting(false)
    if (payout) {
      setConfirmCents(null)
      setJustRequested(payout.amountCents)
      setAmountInput(null)
      setAmountTouched(false)
      toast({ tone: 'success', title: 'Payout requested' })
    } else {
      setConfirmCents(null)
      toast({ tone: 'danger', title: usePayoutStore.getState().requestPayoutError ?? 'We could not submit your payout request. Please try again.' })
    }
  }

  const confirmCancelRequest = async () => {
    if (!pending) return
    setCancelling(true)
    const payout = await cancelRequest(slug, pending.publicId)
    setCancelling(false)
    setConfirmCancel(false)
    if (payout) {
      setJustRequested(null)
      toast({ tone: 'success', title: 'Request cancelled', message: 'The amount is back in your balance.' })
    } else {
      toast({ tone: 'danger', title: usePayoutStore.getState().cancelPayoutError ?? 'We could not cancel this payout request. Please try again.' })
    }
  }

  const openBank = () => {
    setBankKey((key) => key + 1)
    setBankOpen(true)
  }

  let requestBody
  if (noBank) {
    requestBody = (
      <div className="alert">
        <Landmark />
        <div className="alert__body">Add your bank details to request a payout.</div>
      </div>
    )
  } else if (pending) {
    requestBody = (
      <>
        <Field label="Amount" hint="Only one request can be waiting at a time.">
          {(control) => (
            <InputGroup>
              <InputAddon>{currencySymbol(currency)}</InputAddon>
              <Input {...control} className="num" value={formatPriceInput(pending.amountCents)} disabled readOnly />
            </InputGroup>
          )}
        </Field>
        <Alert tone="warning" icon={Hourglass}>
          You already have a request of {money(pending.amountCents, currency)} waiting.
        </Alert>
      </>
    )
  } else if (available === 0) {
    requestBody = <p className="text-secondary">Nothing to pay out yet — your balance grows with every sale.</p>
  } else {
    requestBody = (
      <>
        <Field
          label="Amount"
          error={amountTouched ? amountError : undefined}
          hint={amountTouched && amountError ? undefined : `Available: ${money(available, currency)} · minimum ${money(minimum, currency)}`}
        >
          {(control) => (
            <InputGroup>
              <InputAddon>{currencySymbol(currency)}</InputAddon>
              <Input
                {...control}
                className="num"
                inputMode="decimal"
                autoComplete="off"
                value={amountText}
                onChange={(event) => setAmountInput(event.target.value)}
                onBlur={() => setAmountTouched(true)}
              />
            </InputGroup>
          )}
        </Field>
        <div>
          <Button variant="primary" icon={Banknote} disabledReason={requestTip} onClick={askRequest}>
            Request payout
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={<em>Payouts</em>}
        subtitle="Your earnings are collected here — request a transfer to your bank any time."
        actions={
          <Button variant="accent" icon={Banknote} disabledReason={requestTip} onClick={askRequest}>
            Request payout
          </Button>
        }
      />
      <div className="stack stack--lg reveal">
        {justRequested !== null && profile && (
          <Alert tone="success" icon={CircleCheck} title="Payout requested" live>
            {money(justRequested, currency)} is on its way to {profile.maskedIban}. Transfers usually arrive within two
            to three business days.
          </Alert>
        )}
        <div className="grid grid--3">
          <article className="card card--feature">
            <div className="card__body metric metric--hero">
              <span className="metric__label">
                <Wallet />
                Available
              </span>
              <span className="metric__value">
                <Money amountCents={available} currency={currency} />
              </span>
              <span className="metric__meta">Minimum payout {money(minimum, currency)}</span>
            </div>
          </article>
          {pending ? (
            <Metric
              label="Pending request"
              icon={Hourglass}
              value={<Money amountCents={pending.amountCents} currency={currency} />}
              meta={
                <>
                  Requested {date(pending.requestedAt)} ·{' '}
                  <button className="link link--button" type="button" onClick={() => setConfirmCancel(true)}>
                    Cancel
                  </button>
                </>
              }
            />
          ) : (
            <Metric label="Pending request" icon={Hourglass} value="—" meta="No request waiting" />
          )}
          <Metric
            label="Paid out"
            icon={CircleCheck}
            value={<Money amountCents={summary.totalPaidOutCents} currency={currency} />}
            meta="all time"
          />
        </div>
        <div className="grid grid--2">
          {noBank ? (
            <Card title="Bank details">
              <EmptyState
                compact
                icon={Landmark}
                title="Add your bank account"
                text="We pay your earnings to this account. It must be in your own name."
                action={{ label: 'Add bank details', icon: Plus, variant: 'primary', onClick: openBank }}
              />
            </Card>
          ) : (
            <Card
              title="Bank details"
              action={
                <Button variant="ghost" icon={Pencil} onClick={openBank}>
                  Edit
                </Button>
              }
            >
              <dl className="kv">
                <dt>Account holder</dt>
                <dd>{profile.accountHolderName}</dd>
                <dt>IBAN</dt>
                <dd className="mono">{profile.maskedIban}</dd>
                <dt>Bank country</dt>
                <dd>{countryName(profile.bankCountryCode)}</dd>
              </dl>
            </Card>
          )}
          <Card title="Request a payout">
            <div className="form">{requestBody}</div>
          </Card>
        </div>
        <Card title="History" flush>
          {historyStatus === 'success' && history.length === 0 ? (
            <EmptyState
              compact
              icon={Receipt}
              title="No payouts yet"
              text="When you request a payout, it shows up here with its status and the bank reference."
            />
          ) : historyStatus === 'error' ? (
            <ErrorState compact onRetry={() => void loadHistory(slug)} />
          ) : historyStatus === 'success' ? (
            <div className="table-wrap">
              <table className="table table--stack">
                <thead>
                  <tr>
                    <th scope="col">Requested</th>
                    <th scope="col">Status</th>
                    <th scope="col">Reference</th>
                    <th scope="col" className="is-num">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((payout) => (
                    <tr key={payout.publicId}>
                      <td className="is-lead num">{date(payout.createdAt)}</td>
                      <td data-label="Status">
                        <StatusBadge kind="payout" value={payoutStatusKey(payout.status)} />
                      </td>
                      <td data-label="Reference" className="mono text-sm">
                        {payout.bankReference || payout.note || '—'}
                      </td>
                      <td data-label="Amount" className="is-num">
                        <Money amountCents={payout.amountCents} currency={payout.currency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <SkeletonRows count={3} />
          )}
        </Card>
      </div>

      {bankKey > 0 && (
        <BankDetailsModal
          key={bankKey}
          open={bankOpen}
          slug={slug}
          profile={profile}
          defaultCountry={creator.countryCode}
          onClose={() => setBankOpen(false)}
          onSaved={(saved) => {
            setBankOpen(false)
            // The shell's "payouts aren’t set up" banner follows the workspace's payout-profile flag.
            void useCreatorStore.getState().loadCurrentCreator()
            toast({ tone: 'success', title: 'Bank details saved', message: `Payouts go to ${saved.maskedIban}.` })
          }}
        />
      )}

      <ConfirmDialog
        open={confirmCents !== null}
        title={`Request a payout of ${confirmCents !== null ? money(confirmCents, currency) : ''}?`}
        text={`We’ll transfer it to ${profile?.maskedIban ?? 'your bank account'}. Transfers usually arrive within two to three business days.`}
        confirmLabel="Request payout"
        tone="warning"
        icon={Banknote}
        busy={requesting}
        onCancel={() => setConfirmCents(null)}
        onConfirm={() => void confirmRequest()}
      />
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this payout request?"
        text={`${pending ? money(pending.amountCents, currency) : ''} goes back to your available balance. You can request a new payout any time.`}
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
        tone="warning"
        icon={Undo2}
        busy={cancelling}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => void confirmCancelRequest()}
      />
    </>
  )
}
