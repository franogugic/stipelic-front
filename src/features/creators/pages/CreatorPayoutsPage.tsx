import {
  Banknote,
  CreditCard,
  ExternalLink,
  Landmark,
  Loader2,
  Pencil,
  Save,
  Send,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { useCreatorStore } from '../model/creator-store'
import { usePayoutStore } from '../model/payout-store'
import type { Creator, Payout, PayoutProfile, PayoutStatus, UpdatePayoutProfileRequest } from '../model/types'

const STRIPE_EXPRESS_DASHBOARD_URL = 'https://connect.stripe.com/express_login'

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'
type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

export function CreatorPayoutsPage() {
  const { slug } = useParams<{ slug: string }>()
  const normalizedSlug = slug ?? ''

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creator = currentCreator?.slug === normalizedSlug ? currentCreator : null

  const connectOnboardingStatus = usePayoutStore((s) => s.connectOnboardingStatus)
  const connectOnboardingError = usePayoutStore((s) => s.connectOnboardingError)
  const startConnectOnboardingLink = usePayoutStore((s) => s.startConnectOnboardingLink)
  const resetConnectOnboardingFeedback = usePayoutStore((s) => s.resetConnectOnboardingFeedback)

  const payoutSummary = usePayoutStore((s) => s.payoutSummary)
  const payoutSummaryStatus = usePayoutStore((s) => s.payoutSummaryStatus)
  const loadPayoutSummary = usePayoutStore((s) => s.loadPayoutSummary)

  const payoutHistory = usePayoutStore((s) => s.payoutHistory)
  const payoutHistoryStatus = usePayoutStore((s) => s.payoutHistoryStatus)
  const loadPayoutHistory = usePayoutStore((s) => s.loadPayoutHistory)

  const payoutProfile = usePayoutStore((s) => s.payoutProfile)
  const payoutProfileStatus = usePayoutStore((s) => s.payoutProfileStatus)
  const loadPayoutProfile = usePayoutStore((s) => s.loadPayoutProfile)
  const updatePayoutProfileStatus = usePayoutStore((s) => s.updatePayoutProfileStatus)
  const updatePayoutProfileError = usePayoutStore((s) => s.updatePayoutProfileError)
  const savePayoutProfile = usePayoutStore((s) => s.savePayoutProfile)
  const resetUpdatePayoutProfileFeedback = usePayoutStore((s) => s.resetUpdatePayoutProfileFeedback)

  const requestPayoutStatus = usePayoutStore((s) => s.requestPayoutStatus)
  const requestPayoutError = usePayoutStore((s) => s.requestPayoutError)
  const requestPayoutForSlug = usePayoutStore((s) => s.requestPayoutForSlug)
  const resetRequestPayoutFeedback = usePayoutStore((s) => s.resetRequestPayoutFeedback)

  const cancelPayoutStatus = usePayoutStore((s) => s.cancelPayoutStatus)
  const cancelPayoutError = usePayoutStore((s) => s.cancelPayoutError)
  const cancelPayoutRequestForSlug = usePayoutStore((s) => s.cancelPayoutRequestForSlug)
  const resetCancelPayoutFeedback = usePayoutStore((s) => s.resetCancelPayoutFeedback)

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (!normalizedSlug || !creator) return
    if (creator.payoutMode !== 'BankTransfer') return
    void loadPayoutSummary(normalizedSlug)
    void loadPayoutHistory(normalizedSlug)
    void loadPayoutProfile(normalizedSlug)
    const refetchOnFocus = () => {
      void loadPayoutSummary(normalizedSlug)
      void loadPayoutHistory(normalizedSlug)
      void loadPayoutProfile(normalizedSlug)
    }
    window.addEventListener('focus', refetchOnFocus)
    return () => window.removeEventListener('focus', refetchOnFocus)
  }, [creator, normalizedSlug, loadPayoutSummary, loadPayoutHistory, loadPayoutProfile])

  if (!slug) return null

  return (
    <AppShell slug={slug} activeSection="payouts">
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white light:text-neutral-950">Payouts</h1>
          <p className="mt-1 text-sm text-white/40 light:text-neutral-400">
            {creator?.name ?? `/${normalizedSlug}`} · how you get paid for sales made through your landing pages.
          </p>
        </div>

        {currentCreatorStatus === 'loading' || currentCreatorStatus === 'idle' ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading…
          </div>
        ) : !creator ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Workspace not found.
          </div>
        ) : creator.payoutMode === 'StripeConnect' ? (
          <ConnectPayoutsSection
            creator={creator}
            onboardingStatus={connectOnboardingStatus}
            onboardingError={connectOnboardingError}
            onStartOnboarding={() =>
              void startConnectOnboardingLink().then((url) => {
                if (url) window.location.href = url
              })
            }
            onResetFeedback={resetConnectOnboardingFeedback}
          />
        ) : (
          <BankTransferPayoutsSection
            creator={creator}
            payoutSummary={payoutSummary}
            payoutSummaryStatus={payoutSummaryStatus}
            payoutHistory={payoutHistory}
            payoutHistoryStatus={payoutHistoryStatus}
            payoutProfile={payoutProfile}
            payoutProfileStatus={payoutProfileStatus}
            updatePayoutProfileStatus={updatePayoutProfileStatus}
            updatePayoutProfileError={updatePayoutProfileError}
            onSavePayoutProfile={async (request) => {
              const saved = await savePayoutProfile(normalizedSlug, request)
              if (saved) void loadCurrentCreator()
              return saved
            }}
            onResetPayoutProfileFeedback={resetUpdatePayoutProfileFeedback}
            requestPayoutStatus={requestPayoutStatus}
            requestPayoutError={requestPayoutError}
            onRequestPayout={(amountCents) => requestPayoutForSlug(normalizedSlug, amountCents)}
            onResetRequestPayoutFeedback={resetRequestPayoutFeedback}
            cancelPayoutStatus={cancelPayoutStatus}
            cancelPayoutError={cancelPayoutError}
            onCancelPayout={(payoutPublicId) => cancelPayoutRequestForSlug(normalizedSlug, payoutPublicId)}
            onResetCancelPayoutFeedback={resetCancelPayoutFeedback}
          />
        )}
      </div>
    </AppShell>
  )
}

/* ─── Stripe Connect ──────────────────────────────────────────── */

function ConnectPayoutsSection({
  creator,
  onboardingStatus,
  onboardingError,
  onStartOnboarding,
  onResetFeedback,
}: {
  creator: Creator
  onboardingStatus: SubmitStatus
  onboardingError: string | null
  onStartOnboarding: () => void
  onResetFeedback: () => void
}) {
  const isReady = creator.stripeConnectPayoutsEnabled
  const inProgress = creator.stripeConnectDetailsSubmitted && !isReady

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-semibold text-white light:text-neutral-950">Stripe Connect status</p>
        <div className="mt-4 flex items-start justify-between gap-4 rounded-xl bg-muted px-5 py-4">
          <div>
            <PayoutStatusPill
              label={isReady ? 'Ready' : inProgress ? 'In progress' : 'Not connected'}
              tone={isReady ? 'success' : inProgress ? 'warning' : 'neutral'}
            />
            <p className="mt-2.5 text-sm leading-5 text-white/50 light:text-neutral-500">
              {isReady
                ? 'Your Stripe account is connected — payouts are sent automatically by Stripe.'
                : inProgress
                  ? 'Stripe is still verifying your account details.'
                  : 'Connect your Stripe account to start receiving payouts.'}
            </p>
            {onboardingError ? (
              <p className="mt-2 text-xs font-medium text-red-400 light:text-red-600">{onboardingError}</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={onboardingStatus === 'submitting'}
            onClick={() => {
              onResetFeedback()
              onStartOnboarding()
            }}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-50 light:text-neutral-950"
          >
            {onboardingStatus === 'submitting' ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <CreditCard size={14} />
            )}
            {isReady ? 'Manage on Stripe' : inProgress ? 'Continue onboarding' : 'Connect Stripe'}
          </button>
        </div>

        {isReady ? (
          <a
            href={STRIPE_EXPRESS_DASHBOARD_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong transition hover:opacity-80"
          >
            Open your Stripe Express dashboard
            <ExternalLink size={13} />
          </a>
        ) : null}
      </div>

      <aside className="rounded-xl border border-border bg-muted p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-400">How it works</p>
        <p className="mt-2 text-xs leading-5 text-white/50 light:text-neutral-500">
          Stripe handles payouts for Connect creators directly — sale proceeds (minus the platform fee) are
          transferred to your connected account automatically, and Stripe sends payouts to your bank on its
          own schedule. Manage your payout schedule and bank details from your Stripe Express dashboard.
        </p>
      </aside>
    </div>
  )
}

/* ─── BankTransfer ────────────────────────────────────────────── */

function BankTransferPayoutsSection({
  creator,
  payoutSummary,
  payoutSummaryStatus,
  payoutHistory,
  payoutHistoryStatus,
  payoutProfile,
  payoutProfileStatus,
  updatePayoutProfileStatus,
  updatePayoutProfileError,
  onSavePayoutProfile,
  onResetPayoutProfileFeedback,
  requestPayoutStatus,
  requestPayoutError,
  onRequestPayout,
  onResetRequestPayoutFeedback,
  cancelPayoutStatus,
  cancelPayoutError,
  onCancelPayout,
  onResetCancelPayoutFeedback,
}: {
  creator: Creator
  payoutSummary: { currency: string; balanceCents: number; pendingPayoutCents: number; minPayoutCents: number } | null
  payoutSummaryStatus: LoadStatus
  payoutHistory: Payout[]
  payoutHistoryStatus: LoadStatus
  payoutProfile: PayoutProfile | null
  payoutProfileStatus: LoadStatus
  updatePayoutProfileStatus: SubmitStatus
  updatePayoutProfileError: string | null
  onSavePayoutProfile: (request: UpdatePayoutProfileRequest) => Promise<PayoutProfile | null>
  onResetPayoutProfileFeedback: () => void
  requestPayoutStatus: SubmitStatus
  requestPayoutError: string | null
  onRequestPayout: (amountCents: number | null) => Promise<Payout | null>
  onResetRequestPayoutFeedback: () => void
  cancelPayoutStatus: SubmitStatus
  cancelPayoutError: string | null
  onCancelPayout: (payoutPublicId: string) => Promise<Payout | null>
  onResetCancelPayoutFeedback: () => void
}) {
  const pendingPayout = payoutHistory.find((p) => p.status === 'Pending') ?? null

  return (
    <div className="grid gap-6">
      <RequestPayoutCard
        creator={creator}
        payoutSummary={payoutSummary}
        payoutSummaryStatus={payoutSummaryStatus}
        pendingPayout={pendingPayout}
        requestPayoutStatus={requestPayoutStatus}
        requestPayoutError={requestPayoutError}
        onRequestPayout={onRequestPayout}
        onResetRequestPayoutFeedback={onResetRequestPayoutFeedback}
        cancelPayoutStatus={cancelPayoutStatus}
        cancelPayoutError={cancelPayoutError}
        onCancelPayout={onCancelPayout}
        onResetCancelPayoutFeedback={onResetCancelPayoutFeedback}
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-semibold text-white light:text-neutral-950">Bank details</p>
        <p className="mt-0.5 text-xs text-white/40 light:text-neutral-400">
          The account your payouts are sent to.
        </p>
        <div className="mt-5">
          <BankDetailsForm
            creator={creator}
            payoutProfile={payoutProfile}
            payoutProfileStatus={payoutProfileStatus}
            updateStatus={updatePayoutProfileStatus}
            updateError={updatePayoutProfileError}
            onSave={onSavePayoutProfile}
            onResetFeedback={onResetPayoutProfileFeedback}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-semibold text-white light:text-neutral-950">Payout history</p>
        <div className="mt-4">
          <PayoutHistoryTable payoutHistory={payoutHistory} payoutHistoryStatus={payoutHistoryStatus} />
        </div>
      </div>
    </div>
  )
}

function RequestPayoutCard({
  creator,
  payoutSummary,
  payoutSummaryStatus,
  pendingPayout,
  requestPayoutStatus,
  requestPayoutError,
  onRequestPayout,
  onResetRequestPayoutFeedback,
  cancelPayoutStatus,
  cancelPayoutError,
  onCancelPayout,
  onResetCancelPayoutFeedback,
}: {
  creator: Creator
  payoutSummary: { currency: string; balanceCents: number; pendingPayoutCents: number; minPayoutCents: number } | null
  payoutSummaryStatus: LoadStatus
  pendingPayout: Payout | null
  requestPayoutStatus: SubmitStatus
  requestPayoutError: string | null
  onRequestPayout: (amountCents: number | null) => Promise<Payout | null>
  onResetRequestPayoutFeedback: () => void
  cancelPayoutStatus: SubmitStatus
  cancelPayoutError: string | null
  onCancelPayout: (payoutPublicId: string) => Promise<Payout | null>
  onResetCancelPayoutFeedback: () => void
}) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [useCustomAmount, setUseCustomAmount] = useState(false)
  const [amount, setAmount] = useState('')

  if (payoutSummaryStatus === 'loading' || payoutSummaryStatus === 'idle') {
    return (
      <div className="flex h-32 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm text-muted-foreground">
        <Loader2 className="animate-spin" size={14} />
        Loading balance…
      </div>
    )
  }

  const balanceCents = payoutSummary?.balanceCents ?? 0
  const currency = payoutSummary?.currency ?? creator.defaultCurrency
  const minPayoutCents = payoutSummary?.minPayoutCents ?? 0
  const pendingCents = payoutSummary?.pendingPayoutCents ?? 0
  const belowMinimum = balanceCents < minPayoutCents

  const customAmountCents = Math.round(Number(amount) * 100)
  const requestedAmountCents = useCustomAmount ? customAmountCents : null
  const canSubmit =
    !belowMinimum &&
    requestPayoutStatus !== 'submitting' &&
    (!useCustomAmount ||
      (Number.isFinite(customAmountCents) &&
        customAmountCents >= minPayoutCents &&
        customAmountCents <= balanceCents))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const payout = await onRequestPayout(requestedAmountCents)
    if (payout) {
      setIsRequesting(false)
      setUseCustomAmount(false)
      setAmount('')
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border p-7"
      style={{
        background: 'linear-gradient(135deg, rgba(76,124,240,0.14), transparent 60%)',
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-400">
        Available balance
      </p>
      <p className="font-data mt-1.5 text-4xl font-bold leading-none tracking-tight text-accent-strong tabular-nums">
        {formatMoney(balanceCents, currency)}
      </p>
      {pendingCents > 0 ? (
        <p className="mt-2 text-xs font-medium text-white/40 light:text-neutral-500">
          Reserved in pending request: {formatMoney(pendingCents, currency)}
        </p>
      ) : null}

      <div className="mt-6">
        {pendingPayout ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-5 py-4 light:border-amber-200 light:bg-amber-50">
            <div>
              <PayoutStatusPill label="Pending" tone="warning" />
              <p className="mt-2 text-sm text-white/70 light:text-neutral-600">
                {formatMoney(pendingPayout.amountCents, pendingPayout.currency)} requested — waiting for the
                platform to process it.
              </p>
              {cancelPayoutError ? (
                <p className="mt-1.5 text-xs font-medium text-red-400 light:text-red-600">{cancelPayoutError}</p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={cancelPayoutStatus === 'submitting'}
              onClick={() => {
                if (!window.confirm('Cancel this payout request? The reserved balance will be returned.')) return
                onResetCancelPayoutFeedback()
                void onCancelPayout(pendingPayout.publicId)
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40 light:border-red-200 light:bg-red-50 light:text-red-700"
            >
              {cancelPayoutStatus === 'submitting' ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
              Cancel request
            </button>
          </div>
        ) : !isRequesting ? (
          <div>
            {belowMinimum ? (
              <p className="text-sm text-white/40 light:text-neutral-500">
                Minimum payout is {formatMoney(minPayoutCents, currency)}. Keep selling to reach the threshold.
              </p>
            ) : null}
            <button
              type="button"
              disabled={belowMinimum}
              onClick={() => {
                onResetRequestPayoutFeedback()
                setIsRequesting(true)
              }}
              className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40 light:text-neutral-950"
            >
              <Send size={14} />
              Request payout
            </button>
          </div>
        ) : (
          <form
            className="grid gap-3 rounded-xl border border-border bg-muted p-4"
            onSubmit={(e) => void handleSubmit(e)}
          >
            <label className="flex items-center gap-2 text-sm text-white/70 light:text-neutral-600">
              <input
                type="radio"
                checked={!useCustomAmount}
                onChange={() => setUseCustomAmount(false)}
              />
              Full available balance ({formatMoney(balanceCents, currency)})
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70 light:text-neutral-600">
              <input
                type="radio"
                checked={useCustomAmount}
                onChange={() => setUseCustomAmount(true)}
              />
              Custom amount
            </label>
            {useCustomAmount ? (
              <input
                type="number"
                min={0}
                step="0.01"
                autoFocus
                value={amount}
                onChange={(e) => { onResetRequestPayoutFeedback(); setAmount(e.target.value) }}
                placeholder={`Amount in ${currency}`}
                className="h-9 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none focus:border-accent/50"
              />
            ) : null}

            {requestPayoutError ? (
              <p className="text-xs font-medium text-red-400 light:text-red-600">{requestPayoutError}</p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setIsRequesting(false); setUseCustomAmount(false); setAmount('') }}
                className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40 light:text-neutral-950"
              >
                {requestPayoutStatus === 'submitting' ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                Submit request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function BankDetailsForm({
  creator,
  payoutProfile,
  payoutProfileStatus,
  updateStatus,
  updateError,
  onSave,
  onResetFeedback,
}: {
  creator: Creator
  payoutProfile: PayoutProfile | null
  payoutProfileStatus: LoadStatus
  updateStatus: SubmitStatus
  updateError: string | null
  onSave: (request: UpdatePayoutProfileRequest) => Promise<PayoutProfile | null>
  onResetFeedback: () => void
}) {
  const [accountHolderName, setAccountHolderName] = useState('')
  const [iban, setIban] = useState('')
  const [bankCountryCode, setBankCountryCode] = useState(creator.countryCode)
  const [ibanTouched, setIbanTouched] = useState(false)
  const [isEditing, setIsEditing] = useState(!payoutProfile)

  const [syncedProfile, setSyncedProfile] = useState(payoutProfile)
  if (payoutProfile !== syncedProfile) {
    setSyncedProfile(payoutProfile)
    if (payoutProfile) {
      setAccountHolderName(payoutProfile.accountHolderName)
      setBankCountryCode(payoutProfile.bankCountryCode)
    }
    setIsEditing(!payoutProfile)
  }

  const ibanError = ibanTouched && iban.trim() && !isPlausibleIban(iban) ? 'This doesn’t look like a valid IBAN.' : undefined
  const canSubmit =
    accountHolderName.trim().length > 0 &&
    isPlausibleIban(iban) &&
    /^[A-Z]{2}$/.test(bankCountryCode.trim().toUpperCase()) &&
    updateStatus !== 'submitting'

  const cancelEdit = () => {
    onResetFeedback()
    setIban('')
    setIbanTouched(false)
    if (payoutProfile) {
      setAccountHolderName(payoutProfile.accountHolderName)
      setBankCountryCode(payoutProfile.bankCountryCode)
      setIsEditing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const saved = await onSave({ accountHolderName, iban, bankCountryCode: bankCountryCode.toUpperCase() })
    if (saved) {
      setIban('')
      setIsEditing(false)
    }
  }

  if (payoutProfileStatus === 'loading' || payoutProfileStatus === 'idle') {
    return (
      <div className="flex h-24 items-center justify-center gap-2 text-sm text-white/40 light:text-neutral-400">
        <Loader2 className="animate-spin" size={14} />
        Loading bank details…
      </div>
    )
  }

  if (payoutProfile && !isEditing) {
    return (
      <div className="grid gap-4 rounded-xl border border-border p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField icon={User} label="Account holder name" value={payoutProfile.accountHolderName} />
          <ReadOnlyField icon={Landmark} label="Bank country" value={payoutProfile.bankCountryCode} />
        </div>
        <ReadOnlyField icon={CreditCard} label="IBAN" value={payoutProfile.maskedIban} mono />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { onResetFeedback(); setIsEditing(true) }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
          >
            <Pencil size={14} />
            Edit bank details
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="grid gap-4 rounded-xl border border-border p-5"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-white/80 light:text-neutral-700">
            <User size={14} className="text-white/40 light:text-neutral-400" />
            Account holder name
          </label>
          <input
            className="h-[42px] w-full rounded-lg border border-border bg-secondary px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/40 focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
            placeholder="Jane Doe"
            maxLength={100}
            value={accountHolderName}
            onChange={(e) => { onResetFeedback(); setAccountHolderName(e.target.value) }}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-white/80 light:text-neutral-700">
            <Landmark size={14} className="text-white/40 light:text-neutral-400" />
            Bank country
          </label>
          <input
            className="h-[42px] w-full rounded-lg border border-border bg-secondary px-3.5 text-sm uppercase text-foreground outline-none transition placeholder:text-muted-foreground/40 focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
            placeholder={creator.countryCode}
            maxLength={2}
            value={bankCountryCode}
            onChange={(e) => { onResetFeedback(); setBankCountryCode(e.target.value.toUpperCase()) }}
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-white/80 light:text-neutral-700">IBAN</label>
        <input
          className={[
            'h-[42px] w-full rounded-xl border px-3.5 font-mono text-sm uppercase tracking-wide text-white outline-none transition placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-white/30',
            'focus:ring-2',
            ibanError
              ? 'border-red-400/50 bg-red-500/5 focus:border-red-400 focus:ring-red-500/20'
              : 'border-border bg-secondary focus:border-accent/50 focus:ring-accent/10',
            'light:text-neutral-950 light:placeholder-neutral-400',
            ibanError ? 'light:border-red-300 light:bg-red-50/50' : 'light:border-neutral-200 light:bg-white light:focus:border-neutral-400 light:focus:ring-neutral-100',
          ].join(' ')}
          placeholder={payoutProfile ? payoutProfile.maskedIban : 'e.g. DE89370400440532013000'}
          maxLength={34}
          value={iban}
          onBlur={() => setIbanTouched(true)}
          onChange={(e) => { onResetFeedback(); setIban(e.target.value) }}
        />
        {ibanError ? (
          <p className="text-xs font-medium text-red-400 light:text-red-600">{ibanError}</p>
        ) : (
          <p className="text-xs text-white/40 light:text-neutral-400">
            Never shown again in full once saved — only the last 4 digits are displayed.
          </p>
        )}
      </div>

      {updateError ? (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 light:bg-red-50 light:text-red-600">
          {updateError}
        </p>
      ) : null}
      {updateStatus === 'success' ? (
        <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300 light:bg-emerald-50 light:text-emerald-700">
          Bank details saved.
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        {payoutProfile ? (
          <button
            type="button"
            onClick={cancelEdit}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition hover:bg-secondary"
          >
            <X size={14} />
            Cancel
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40 light:text-neutral-950"
        >
          {updateStatus === 'submitting' ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          Save bank details
        </button>
      </div>
    </form>
  )
}

/* ─── Shared bits ─────────────────────────────────────────────── */

function ReadOnlyField({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof User
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-white/80 light:text-neutral-700">
        <Icon size={14} className="text-white/40 light:text-neutral-400" />
        {label}
      </label>
      <p className={`flex h-[42px] items-center rounded-lg border border-border bg-muted px-3.5 text-sm text-muted-foreground ${mono ? 'font-mono uppercase tracking-wide' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function PayoutHistoryTable({
  payoutHistory,
  payoutHistoryStatus,
}: {
  payoutHistory: Payout[]
  payoutHistoryStatus: LoadStatus
}) {
  if (payoutHistoryStatus === 'loading' || payoutHistoryStatus === 'idle') {
    return (
      <div className="flex h-20 items-center justify-center gap-2 text-sm text-white/40 light:text-neutral-400">
        <Loader2 className="animate-spin" size={14} />
        Loading payout history…
      </div>
    )
  }

  if (payoutHistory.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 py-8 text-center text-sm text-white/40 light:border-neutral-300 light:text-neutral-400">
        <Banknote className="mx-auto mb-2 text-white/15 light:text-neutral-300" size={20} />
        No payouts yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5">Date</th>
            <th className="px-4 py-2.5">Amount</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Reference</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {payoutHistory.map((payout) => (
            <tr key={payout.publicId}>
              <td className="px-4 py-3 text-white/50 light:text-neutral-500">
                {new Date(payout.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </td>
              <td className="font-data px-4 py-3 font-medium tabular-nums text-white light:text-neutral-950">
                {formatMoney(payout.amountCents, payout.currency)}
              </td>
              <td className="px-4 py-3">
                <PayoutStatusPill label={payout.status} tone={payoutStatusTone(payout.status)} />
              </td>
              <td className="px-4 py-3 text-white/50 light:text-neutral-500">{payout.bankReference ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PayoutStatusPill({ label, tone }: { label: string; tone: 'success' | 'warning' | 'error' | 'neutral' }) {
  const toneClasses =
    tone === 'success'
      ? 'bg-emerald-500/15 text-emerald-300 light:bg-emerald-50 light:text-emerald-700'
      : tone === 'warning'
        ? 'bg-amber-500/15 text-amber-300 light:bg-amber-50 light:text-amber-700'
        : tone === 'error'
          ? 'bg-red-500/15 text-red-300 light:bg-red-50 light:text-red-700'
          : 'bg-white/10 text-white/50 light:bg-neutral-100 light:text-neutral-500'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses}`}>
      {label}
    </span>
  )
}

function payoutStatusTone(status: PayoutStatus): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'Paid') return 'success'
  if (status === 'Failed') return 'error'
  if (status === 'Cancelled') return 'neutral'
  return 'warning'
}

function formatMoney(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: currency.toUpperCase() })
}

// Client-side structural + mod-97 checksum check (mirrors backend IbanValidator) — purely for fast UX
// feedback; the server remains the authority and re-validates on save.
function isPlausibleIban(value: string): boolean {
  const normalized = value.replace(/\s+/g, '').toUpperCase()
  if (normalized.length < 15 || normalized.length > 34) return false
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(normalized)) return false

  const rearranged = normalized.slice(4) + normalized.slice(0, 4)
  let remainder = 0
  for (const char of rearranged) {
    const value = char >= '0' && char <= '9' ? char.charCodeAt(0) - 48 : char.charCodeAt(0) - 55
    remainder = value < 10
      ? (remainder * 10 + value) % 97
      : (remainder * 100 + value) % 97
  }
  return remainder === 1
}
