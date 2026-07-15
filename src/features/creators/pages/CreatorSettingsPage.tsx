import {
  AtSign,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Fingerprint,
  Globe2,
  Hash,
  Image,
  Landmark,
  Loader2,
  Palette,
  Save,
  User,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
import { creatorConstraints } from '../model/creator-constraints'
import { useCreatorStore } from '../model/creator-store'
import { usePayoutStore } from '../model/payout-store'
import type {
  Creator,
  CreatorSettings,
  Payout,
  PayoutProfile,
  PayoutStatus,
  UpdateCreatorSettingsRequest,
  UpdatePayoutProfileRequest,
} from '../model/types'

const emptySettingsForm: UpdateCreatorSettingsRequest = {
  supportEmail: '',
  brandName: '',
  logoUrl: '',
  primaryColor: '#111827',
  timezone: 'Europe/Sarajevo',
  language: 'en',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const timezonePattern = /^[A-Za-z0-9_./+-]+$/

type SettingsDraft = {
  slug: string
  values: Partial<UpdateCreatorSettingsRequest>
}

export function CreatorSettingsPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const creatorSettings = useCreatorStore((s) => s.creatorSettings)
  const creatorSettingsStatus = useCreatorStore((s) => s.creatorSettingsStatus)
  const creatorSettingsError = useCreatorStore((s) => s.creatorSettingsError)
  const loadCreatorSettings = useCreatorStore((s) => s.loadCreatorSettings)
  const updateCreatorSettingsProfile = useCreatorStore((s) => s.updateCreatorSettingsProfile)
  const updateSettingsStatus = useCreatorStore((s) => s.updateSettingsStatus)
  const updateSettingsError = useCreatorStore((s) => s.updateSettingsError)
  const resetUpdateCreatorSettingsFeedback = useCreatorStore(
    (s) => s.resetUpdateCreatorSettingsFeedback,
  )
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)

  const connectOnboardingStatus = usePayoutStore((s) => s.connectOnboardingStatus)
  const connectOnboardingError = usePayoutStore((s) => s.connectOnboardingError)
  const startConnectOnboardingLink = usePayoutStore((s) => s.startConnectOnboardingLink)
  const resetConnectOnboardingFeedback = usePayoutStore((s) => s.resetConnectOnboardingFeedback)
  const payoutProfile = usePayoutStore((s) => s.payoutProfile)
  const payoutProfileStatus = usePayoutStore((s) => s.payoutProfileStatus)
  const loadPayoutProfile = usePayoutStore((s) => s.loadPayoutProfile)
  const updatePayoutProfileStatus = usePayoutStore((s) => s.updatePayoutProfileStatus)
  const updatePayoutProfileError = usePayoutStore((s) => s.updatePayoutProfileError)
  const savePayoutProfile = usePayoutStore((s) => s.savePayoutProfile)
  const resetUpdatePayoutProfileFeedback = usePayoutStore((s) => s.resetUpdatePayoutProfileFeedback)
  const payoutHistory = usePayoutStore((s) => s.payoutHistory)
  const payoutHistoryStatus = usePayoutStore((s) => s.payoutHistoryStatus)
  const loadPayoutHistory = usePayoutStore((s) => s.loadPayoutHistory)

  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>({ slug: '', values: {} })
  // Lazy initializer reads the URL directly at mount so the "checking" state is correct on first
  // render — avoids a synchronous setState inside the effect below that handles this query param.
  const [connectReturnStatus, setConnectReturnStatus] = useState<'idle' | 'checking' | 'done'>(() =>
    new URLSearchParams(window.location.search).get('connect') === 'return' ? 'checking' : 'idle',
  )

  const normalizedSlug = slug ?? ''
  const isLoading = creatorSettingsStatus === 'loading' || creatorSettingsStatus === 'idle'
  const isSaving = updateSettingsStatus === 'submitting'
  const saveSuccess = updateSettingsStatus === 'success'
  const creator = currentCreator?.slug === normalizedSlug ? currentCreator : null

  const baseFormValues = useMemo(
    () => (creatorSettings ? toSettingsFormValues(creatorSettings) : emptySettingsForm),
    [creatorSettings],
  )
  const formValues = useMemo(
    () =>
      settingsDraft.slug === normalizedSlug
        ? { ...baseFormValues, ...settingsDraft.values }
        : baseFormValues,
    [baseFormValues, normalizedSlug, settingsDraft],
  )
  const validation = useMemo(() => validateSettingsForm(formValues), [formValues])
  const isDirty = creatorSettings ? !areSettingsFormsEqual(formValues, baseFormValues) : false

  useEffect(() => {
    if (normalizedSlug) void loadCreatorSettings(normalizedSlug)
  }, [loadCreatorSettings, normalizedSlug])

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (!normalizedSlug || !creator) return
    if (creator.payoutMode === 'BankTransfer') {
      void loadPayoutProfile(normalizedSlug)
      void loadPayoutHistory(normalizedSlug)
    }
  }, [creator, normalizedSlug, loadPayoutProfile, loadPayoutHistory])

  // Stripe Connect return/refresh flow — see CreatorConnectService.StartConnectOnboardingAsync
  // for the exact query params this page must handle. Runs once per page load (guarded by the ref
  // below), since re-triggering on every render/searchParams identity change would loop.
  const connectFlowHandled = useRef(false)
  useEffect(() => {
    if (connectFlowHandled.current) return
    const connectParam = searchParams.get('connect')
    if (!connectParam) return
    connectFlowHandled.current = true

    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('connect')
      return next
    }, { replace: true })

    if (connectParam === 'return') {
      void loadCurrentCreator().finally(() => setConnectReturnStatus('done'))
    } else if (connectParam === 'refresh') {
      void startConnectOnboardingLink().then((url) => {
        if (url) window.location.href = url
      })
    }
  }, [searchParams, setSearchParams, loadCurrentCreator, startConnectOnboardingLink])

  const updateField = <TField extends keyof UpdateCreatorSettingsRequest>(
    fieldName: TField,
    value: UpdateCreatorSettingsRequest[TField],
  ) => {
    resetUpdateCreatorSettingsFeedback()
    setSettingsDraft((current) => ({
      slug: normalizedSlug,
      values: {
        ...(current.slug === normalizedSlug ? current.values : {}),
        [fieldName]: value,
      },
    }))
  }

  const submitSettings = async () => {
    if (!normalizedSlug || !validation.isValid || !isDirty || isSaving) return
    const settings = await updateCreatorSettingsProfile(normalizedSlug, formValues)
    if (settings) setSettingsDraft({ slug: normalizedSlug, values: {} })
  }

  if (!slug) return null

  return (
    <AppShell slug={slug} activeSection="settings">
      <div className="px-8 py-8">

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Settings</h1>
            <p className="mt-1 text-sm text-neutral-400">
              {creatorSettings?.creatorName ?? `/${normalizedSlug}`} · workspace configuration
            </p>
          </div>
          {isDirty ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Unsaved changes
            </span>
          ) : null}
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-3 text-sm text-neutral-400">
            <Loader2 className="animate-spin" size={18} />
            Loading settings…
          </div>
        ) : null}

        {/* Error */}
        {creatorSettingsStatus === 'error' ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-semibold text-red-900">Could not load settings</p>
            <p className="mt-1 text-sm text-red-700">{creatorSettingsError}</p>
          </div>
        ) : null}

        {creatorSettingsStatus === 'success' && creatorSettings ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

            {/* Left column */}
            <div className="grid gap-5">
              {/* Brand preview */}
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div
                  className="relative h-36 p-6"
                  style={{ backgroundColor: normalizeColor(formValues.primaryColor) }}
                >
                  <div className="absolute inset-0 bg-black/15" />
                  <div className="relative flex h-full items-end gap-4">
                    <div className="grid size-14 shrink-0 place-items-center rounded-2xl border-[3px] border-white/50 bg-neutral-950 text-lg font-bold text-white shadow-lg">
                      {getInitials(formValues.brandName || creatorSettings.creatorName)}
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-white drop-shadow-sm">
                        {formValues.brandName || creatorSettings.creatorName}
                      </p>
                      <p className="mt-0.5 text-sm text-white/60">/{creatorSettings.slug}</p>
                    </div>
                    <span className="ml-auto rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                      Preview
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-neutral-100 border-t border-neutral-100">
                  <PreviewMeta label="Currency" value={creatorSettings.defaultCurrency} />
                  <PreviewMeta label="Timezone" value={formValues.timezone} />
                  <PreviewMeta label="Language" value={formatLanguage(formValues.language)} />
                </div>
              </div>

              {/* Edit form */}
              <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="border-b border-neutral-100 px-6 py-5">
                  <p className="text-sm font-semibold text-neutral-950">Public details</p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    Displayed on your public creator profile and landing pages.
                  </p>
                </div>

                <form
                  className="p-6"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void submitSettings()
                  }}
                >
                  <div className="grid gap-5">
                    <SettingsField
                      icon={Palette}
                      label="Brand name"
                      maxLength={creatorConstraints.brandName.maxLength}
                      value={formValues.brandName}
                      error={validation.fieldErrors.brandName}
                      onChange={(v) => updateField('brandName', v)}
                      placeholder={creatorSettings.creatorName}
                    />
                    <SettingsField
                      icon={AtSign}
                      label="Support email"
                      type="email"
                      maxLength={creatorConstraints.supportEmail.maxLength}
                      placeholder="hello@example.com"
                      value={formValues.supportEmail}
                      error={validation.fieldErrors.supportEmail}
                      onChange={(v) => updateField('supportEmail', v)}
                    />
                    <SettingsField
                      icon={Image}
                      label="Logo URL"
                      type="url"
                      maxLength={creatorConstraints.logoUrl.maxLength}
                      placeholder="https://example.com/logo.png"
                      value={formValues.logoUrl}
                      error={validation.fieldErrors.logoUrl}
                      onChange={(v) => updateField('logoUrl', v)}
                    />

                    <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
                      <SettingsField
                        icon={Globe2}
                        label="Timezone"
                        maxLength={creatorConstraints.timezone.maxLength}
                        placeholder="Europe/Zagreb"
                        value={formValues.timezone}
                        error={validation.fieldErrors.timezone}
                        onChange={(v) => updateField('timezone', v)}
                      />

                      <div className="grid gap-1.5">
                        <label className="text-sm font-medium text-neutral-700">
                          Primary colour
                        </label>
                        <span className="flex h-[42px] items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 transition focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100">
                          <input
                            className="size-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                            type="color"
                            value={normalizeColor(formValues.primaryColor)}
                            onChange={(e) => updateField('primaryColor', e.target.value)}
                          />
                          <input
                            className="min-w-0 flex-1 text-sm text-neutral-950 outline-none"
                            maxLength={creatorConstraints.primaryColor.maxLength}
                            value={formValues.primaryColor}
                            onChange={(e) => updateField('primaryColor', e.target.value)}
                          />
                        </span>
                        {validation.fieldErrors.primaryColor ? (
                          <p className="text-xs text-red-600">
                            {validation.fieldErrors.primaryColor}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                      <p className="text-sm font-medium text-neutral-700">Language</p>
                      <p className="mt-0.5 text-sm text-neutral-400">
                        English — only available language at this time
                      </p>
                    </div>
                  </div>

                  {updateSettingsError ? (
                    <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                      {updateSettingsError}
                    </p>
                  ) : null}
                  {saveSuccess && !isDirty ? (
                    <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      Settings saved successfully.
                    </p>
                  ) : null}

                  <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-5">
                    <p className="text-xs text-neutral-400">
                      {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
                    </p>
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                      type="submit"
                      disabled={!validation.isValid || !isDirty || isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <Save size={15} />
                      )}
                      Save changes
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right column — workspace info */}
            <aside className="grid gap-4 h-fit">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Workspace info
                </p>
                <div className="mt-4 grid gap-3">
                  <InfoRow icon={Fingerprint} label="Creator ID" value={creatorSettings.creatorPublicId} />
                  <InfoRow icon={Hash} label="Slug" value={`/${creatorSettings.slug}`} />
                  <InfoRow icon={CircleDollarSign} label="Currency" value={creatorSettings.defaultCurrency} />
                  <InfoRow icon={Clock3} label="Timezone" value={formValues.timezone} />
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Tip
                </p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Your brand colour is used as the background accent on landing pages and email
                  templates. Make sure it has enough contrast with white text.
                </p>
              </div>
            </aside>
          </div>
        ) : null}

        {creatorSettingsStatus === 'success' && creator ? (
          <div className="mt-6">
            <PayoutsSection
              creator={creator}
              connectOnboardingStatus={connectOnboardingStatus}
              connectOnboardingError={connectOnboardingError}
              connectReturnStatus={connectReturnStatus}
              onStartOnboarding={() =>
                void startConnectOnboardingLink().then((url) => {
                  if (url) window.location.href = url
                })
              }
              onResetOnboardingFeedback={resetConnectOnboardingFeedback}
              payoutProfile={payoutProfile}
              payoutProfileStatus={payoutProfileStatus}
              updatePayoutProfileStatus={updatePayoutProfileStatus}
              updatePayoutProfileError={updatePayoutProfileError}
              onSavePayoutProfile={async (request) => {
                const saved = await savePayoutProfile(normalizedSlug, request)
                // hasPayoutProfile lives on the Creator record (separate store slice) — refresh it
                // so the "Ready" status flips immediately instead of requiring a reload.
                if (saved) void loadCurrentCreator()
                return saved
              }}
              onResetPayoutProfileFeedback={resetUpdatePayoutProfileFeedback}
              payoutHistory={payoutHistory}
              payoutHistoryStatus={payoutHistoryStatus}
            />
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] text-neutral-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  )
}

function SettingsField({
  icon: Icon,
  label,
  onChange,
  value,
  error,
  maxLength,
  placeholder,
  type = 'text',
}: {
  icon: typeof AtSign
  label: string
  onChange: (value: string) => void
  value: string
  error?: string
  maxLength?: number
  placeholder?: string
  type?: string
}) {
  return (
    <div className="grid gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
        <Icon size={14} className="text-neutral-400" />
        {label}
      </label>
      <input
        className={[
          'h-[42px] w-full rounded-xl border px-3.5 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 transition',
          'focus:ring-2',
          error
            ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100'
            : 'border-neutral-200 bg-white focus:border-neutral-400 focus:ring-neutral-100',
        ].join(' ')}
        maxLength={maxLength}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof AtSign
  label: string
  value: string
}) {
  return (
    <div className="grid gap-0.5">
      <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
        <Icon size={11} />
        {label}
      </p>
      <p className="break-all text-xs font-medium text-neutral-950">{value}</p>
    </div>
  )
}

/* ─── Payouts ─────────────────────────────────────────────────── */

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'
type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

function PayoutsSection({
  creator,
  connectOnboardingStatus,
  connectOnboardingError,
  connectReturnStatus,
  onStartOnboarding,
  onResetOnboardingFeedback,
  payoutProfile,
  payoutProfileStatus,
  updatePayoutProfileStatus,
  updatePayoutProfileError,
  onSavePayoutProfile,
  onResetPayoutProfileFeedback,
  payoutHistory,
  payoutHistoryStatus,
}: {
  creator: Creator
  connectOnboardingStatus: SubmitStatus
  connectOnboardingError: string | null
  connectReturnStatus: 'idle' | 'checking' | 'done'
  onStartOnboarding: () => void
  onResetOnboardingFeedback: () => void
  payoutProfile: PayoutProfile | null
  payoutProfileStatus: LoadStatus
  updatePayoutProfileStatus: SubmitStatus
  updatePayoutProfileError: string | null
  onSavePayoutProfile: (request: UpdatePayoutProfileRequest) => Promise<PayoutProfile | null>
  onResetPayoutProfileFeedback: () => void
  payoutHistory: Payout[]
  payoutHistoryStatus: LoadStatus
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm light:border-neutral-200 light:bg-white light:shadow-sm">
      <p className="text-sm font-semibold text-white light:text-neutral-950">Payouts</p>
      <p className="mt-0.5 text-xs text-white/40 light:text-neutral-400">
        How you get paid for sales made through your landing pages.
      </p>

      {connectReturnStatus === 'checking' ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/60 light:bg-neutral-50 light:text-neutral-600">
          <Loader2 className="animate-spin" size={14} />
          Checking your Stripe connection…
        </div>
      ) : null}

      <div className="mt-5">
        {creator.payoutMode === 'StripeConnect' ? (
          <ConnectPayoutsPanel
            creator={creator}
            onboardingStatus={connectOnboardingStatus}
            onboardingError={connectOnboardingError}
            onStartOnboarding={onStartOnboarding}
            onResetFeedback={onResetOnboardingFeedback}
          />
        ) : (
          <BankTransferPayoutsPanel
            creator={creator}
            payoutProfile={payoutProfile}
            payoutProfileStatus={payoutProfileStatus}
            updateStatus={updatePayoutProfileStatus}
            updateError={updatePayoutProfileError}
            onSave={onSavePayoutProfile}
            onResetFeedback={onResetPayoutProfileFeedback}
            payoutHistory={payoutHistory}
            payoutHistoryStatus={payoutHistoryStatus}
          />
        )}
      </div>
    </div>
  )
}

function ConnectPayoutsPanel({
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
    <div className="flex items-start justify-between gap-4 rounded-xl bg-white/[0.02] px-5 py-4 light:bg-neutral-50">
      <div>
        <PayoutStatusPill
          label={isReady ? 'Ready' : inProgress ? 'In progress' : 'Not connected'}
          tone={isReady ? 'success' : inProgress ? 'warning' : 'neutral'}
        />
        <p className="mt-2.5 text-sm leading-5 text-white/50 light:text-neutral-500">
          {isReady
            ? 'Your Stripe account is connected — payouts are sent automatically.'
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
  )
}

function BankTransferPayoutsPanel({
  creator,
  payoutProfile,
  payoutProfileStatus,
  updateStatus,
  updateError,
  onSave,
  onResetFeedback,
  payoutHistory,
  payoutHistoryStatus,
}: {
  creator: Creator
  payoutProfile: PayoutProfile | null
  payoutProfileStatus: LoadStatus
  updateStatus: SubmitStatus
  updateError: string | null
  onSave: (request: UpdatePayoutProfileRequest) => Promise<PayoutProfile | null>
  onResetFeedback: () => void
  payoutHistory: Payout[]
  payoutHistoryStatus: LoadStatus
}) {
  const [accountHolderName, setAccountHolderName] = useState('')
  const [iban, setIban] = useState('')
  const [bankCountryCode, setBankCountryCode] = useState(creator.countryCode)
  const [ibanTouched, setIbanTouched] = useState(false)

  // Adjust form state when the loaded payout profile changes — done during render (React's
  // recommended pattern for this) rather than in an effect, since an effect would set state
  // synchronously on the render that just loaded the profile.
  const [syncedProfile, setSyncedProfile] = useState(payoutProfile)
  if (payoutProfile !== syncedProfile) {
    setSyncedProfile(payoutProfile)
    if (payoutProfile) {
      setAccountHolderName(payoutProfile.accountHolderName)
      setBankCountryCode(payoutProfile.bankCountryCode)
    }
  }

  const ibanError = ibanTouched && iban.trim() && !isPlausibleIban(iban) ? 'This doesn’t look like a valid IBAN.' : undefined
  const canSubmit =
    accountHolderName.trim().length > 0 &&
    isPlausibleIban(iban) &&
    /^[A-Z]{2}$/.test(bankCountryCode.trim().toUpperCase()) &&
    updateStatus !== 'submitting'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const saved = await onSave({ accountHolderName, iban, bankCountryCode: bankCountryCode.toUpperCase() })
    if (saved) setIban('')
  }

  if (payoutProfileStatus === 'loading' || payoutProfileStatus === 'idle') {
    return (
      <div className="flex h-24 items-center justify-center gap-2 text-sm text-white/40 light:text-neutral-400">
        <Loader2 className="animate-spin" size={14} />
        Loading payout details…
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-start justify-between gap-4 rounded-xl bg-white/[0.02] px-5 py-4 light:bg-neutral-50">
        <div>
          <PayoutStatusPill
            label={creator.hasPayoutProfile ? 'Ready' : 'Bank details missing'}
            tone={creator.hasPayoutProfile ? 'success' : 'warning'}
          />
          <p className="mt-2.5 text-sm leading-5 text-white/50 light:text-neutral-500">
            {creator.hasPayoutProfile
              ? 'Payouts are sent by bank transfer to the account below.'
              : 'Add your bank details to start receiving payouts.'}
          </p>
        </div>
      </div>

      <form
        className="grid gap-4 rounded-xl border border-white/10 p-5 light:border-neutral-200"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-white/80 light:text-neutral-700">
              <User size={14} className="text-white/40 light:text-neutral-400" />
              Account holder name
            </label>
            <input
              className="h-[42px] w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25 focus:ring-2 focus:ring-white/10 light:border-neutral-200 light:bg-white light:text-neutral-950 light:placeholder-neutral-400 light:focus:border-neutral-400 light:focus:ring-neutral-100"
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
              className="h-[42px] w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm uppercase text-white outline-none transition placeholder:text-white/30 focus:border-white/25 focus:ring-2 focus:ring-white/10 light:border-neutral-200 light:bg-white light:text-neutral-950 light:placeholder-neutral-400 light:focus:border-neutral-400 light:focus:ring-neutral-100"
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
                : 'border-white/10 bg-white/[0.03] focus:border-white/25 focus:ring-white/10',
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
            Payout details saved.
          </p>
        ) : null}

        <div className="flex justify-end">
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

      <PayoutHistoryTable payoutHistory={payoutHistory} payoutHistoryStatus={payoutHistoryStatus} />
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
        No payouts yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 light:border-neutral-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-left text-xs font-medium uppercase tracking-wider text-white/40 light:border-neutral-200 light:bg-neutral-50 light:text-neutral-400">
            <th className="px-4 py-2.5">Date</th>
            <th className="px-4 py-2.5">Amount</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Reference</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 light:divide-neutral-100">
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

function payoutStatusTone(status: PayoutStatus): 'success' | 'warning' | 'error' {
  if (status === 'Paid') return 'success'
  if (status === 'Failed') return 'error'
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

/* ─── Helpers ─────────────────────────────────────────────────── */

function formatLanguage(lang: string) {
  return lang.toLowerCase() === 'en' ? 'English' : lang
}

function getInitials(value: string) {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'CP'
  )
}

function normalizeColor(color: string) {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#111827'
}

type SettingsValidation = {
  fieldErrors: Partial<Record<keyof UpdateCreatorSettingsRequest, string>>
  isValid: boolean
}

function validateSettingsForm(values: UpdateCreatorSettingsRequest): SettingsValidation {
  const fieldErrors: SettingsValidation['fieldErrors'] = {}
  const supportEmail = values.supportEmail.trim()
  const brandName = values.brandName.trim()
  const logoUrl = values.logoUrl.trim()
  const primaryColor = values.primaryColor.trim()
  const timezone = values.timezone.trim()
  const language = values.language.trim().toLowerCase()

  if (supportEmail && !emailPattern.test(supportEmail)) {
    fieldErrors.supportEmail = 'Enter a valid email address.'
  } else if (supportEmail.length > creatorConstraints.supportEmail.maxLength) {
    fieldErrors.supportEmail = `Max ${creatorConstraints.supportEmail.maxLength} characters.`
  }
  if (brandName.length > creatorConstraints.brandName.maxLength) {
    fieldErrors.brandName = `Max ${creatorConstraints.brandName.maxLength} characters.`
  }
  if (logoUrl.length > creatorConstraints.logoUrl.maxLength) {
    fieldErrors.logoUrl = `Max ${creatorConstraints.logoUrl.maxLength} characters.`
  } else if (logoUrl) {
    try {
      const parsed = new URL(logoUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        fieldErrors.logoUrl = 'Must be an http or https URL.'
      }
    } catch {
      fieldErrors.logoUrl = 'Enter a valid URL.'
    }
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
    fieldErrors.primaryColor = 'Must be a hex colour like #111827.'
  }
  if (timezone.length > creatorConstraints.timezone.maxLength) {
    fieldErrors.timezone = `Max ${creatorConstraints.timezone.maxLength} characters.`
  } else if (!timezonePattern.test(timezone)) {
    fieldErrors.timezone = 'Invalid timezone format.'
  }
  if (language !== 'en') {
    fieldErrors.language = 'English is the only supported language.'
  }

  return { fieldErrors, isValid: Object.keys(fieldErrors).length === 0 }
}

function toSettingsFormValues(settings: CreatorSettings): UpdateCreatorSettingsRequest {
  return {
    supportEmail: settings.supportEmail,
    brandName: settings.brandName,
    logoUrl: settings.logoUrl,
    primaryColor: settings.primaryColor,
    timezone: settings.timezone,
    language: settings.language || 'en',
  }
}

function areSettingsFormsEqual(
  a: UpdateCreatorSettingsRequest,
  b: UpdateCreatorSettingsRequest,
) {
  return (
    a.supportEmail.trim() === b.supportEmail.trim() &&
    a.brandName.trim() === b.brandName.trim() &&
    a.logoUrl.trim() === b.logoUrl.trim() &&
    a.primaryColor.trim() === b.primaryColor.trim() &&
    a.timezone.trim() === b.timezone.trim() &&
    a.language.trim().toLowerCase() === b.language.trim().toLowerCase()
  )
}
