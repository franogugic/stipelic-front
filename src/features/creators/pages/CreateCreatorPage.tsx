import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Crown,
  Loader2,
  Rocket,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField } from '../../../shared/ui/TextField'
import { CreatorStepIndicator } from '../components/CreatorStepIndicator'
import { creatorConstraints } from '../model/creator-constraints'
import {
  createSlug,
  validateCreateCreatorForm,
  type CreatorStep,
} from '../model/create-creator-validation'
import { useCreatorStore } from '../model/creator-store'
import type { CreateCreatorFormValues, CreatorPlan } from '../model/types'

const initialValues: CreateCreatorFormValues = {
  name: '',
  slug: '',
  planCode: 'free',
  defaultCurrency: 'EUR',
  configureSettingsOnStart: false,
  supportEmail: '',
  brandName: '',
  logoUrl: '',
  primaryColor: '#111827',
  timezone: 'Europe/Sarajevo',
  language: 'en',
}

export function CreateCreatorPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<CreatorStep>('identity')
  const [values, setValues] = useState<CreateCreatorFormValues>(initialValues)
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof CreateCreatorFormValues, boolean>>
  >({})

  const createCreatorProfile = useCreatorStore((state) => state.createCreatorProfile)
  const createStatus = useCreatorStore((state) => state.createStatus)
  const createError = useCreatorStore((state) => state.createError)
  const createdCreator = useCreatorStore((state) => state.createdCreator)
  const creatorPlans = useCreatorStore((state) => state.creatorPlans)
  const creatorPlansStatus = useCreatorStore((state) => state.creatorPlansStatus)
  const creatorPlansError = useCreatorStore((state) => state.creatorPlansError)
  const loadCreatorPlans = useCreatorStore((state) => state.loadCreatorPlans)
  const resetCreateCreatorFeedback = useCreatorStore((state) => state.resetCreateCreatorFeedback)

  const validation = useMemo(() => validateCreateCreatorForm(values), [values])
  const selectedPlan = useMemo(
    () => creatorPlans.find((p) => p.code === values.planCode),
    [creatorPlans, values.planCode],
  )
  const canContinueFromPlan = selectedPlan?.status.toLowerCase() === 'active'
  const isSubmitting = createStatus === 'submitting'

  useEffect(() => { void loadCreatorPlans() }, [loadCreatorPlans])

  const updateField = <TField extends keyof CreateCreatorFormValues>(
    fieldName: TField,
    value: CreateCreatorFormValues[TField],
  ) => {
    resetCreateCreatorFeedback()
    setValues((c) => ({ ...c, [fieldName]: value }))
  }

  const updateName = (value: string) => {
    resetCreateCreatorFeedback()
    setValues((c) => ({ ...c, name: value, slug: c.slug ? c.slug : createSlug(value) }))
  }

  const touchField = (fieldName: keyof CreateCreatorFormValues) =>
    setTouchedFields((c) => ({ ...c, [fieldName]: true }))

  const getError = (fieldName: keyof CreateCreatorFormValues) =>
    touchedFields[fieldName] ? validation.fieldErrors[fieldName] : undefined

  const goToPlan = () => {
    setTouchedFields((c) => ({ ...c, name: true, slug: true }))
    if (validation.isIdentityValid) setStep('plan')
  }

  const goToSetup = () => {
    setTouchedFields((c) => ({ ...c, planCode: true }))
    if (validation.isPlanValid) setStep('setup')
  }

  const goToReview = () => {
    setTouchedFields((c) => ({ ...c, defaultCurrency: true }))
    if (validation.isSetupValid) setStep(values.configureSettingsOnStart ? 'settings' : 'review')
  }

  const goFromSettingsToReview = () => {
    setTouchedFields((c) => ({
      ...c,
      supportEmail: true,
      brandName: true,
      logoUrl: true,
      primaryColor: true,
      timezone: true,
    }))
    if (validation.isSettingsValid) setStep('review')
  }

  const goBack = () => {
    if (step === 'review') { setStep(values.configureSettingsOnStart ? 'settings' : 'setup'); return }
    if (step === 'settings') { setStep('setup'); return }
    if (step === 'setup') { setStep('plan'); return }
    setStep('identity')
  }

  const submitCreator = async () => {
    setTouchedFields({
      name: true, slug: true, planCode: true, defaultCurrency: true,
      configureSettingsOnStart: true, supportEmail: true, brandName: true,
      logoUrl: true, primaryColor: true, timezone: true, language: true,
    })
    if (!validation.isValid) return

    const result = await createCreatorProfile(values)
    if (result?.checkoutUrl) {
      window.location.assign(result.checkoutUrl)
      return
    }
    if (result) navigate('/')
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-neutral-950 text-white">
              <span className="text-xs font-bold">CP</span>
            </span>
            <span className="text-sm font-medium text-neutral-500">New workspace</span>
          </div>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
            type="button"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={15} />
            Cancel
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10 lg:px-8">
        {/* Step indicator */}
        <CreatorStepIndicator
          currentStep={step}
          includeSettings={values.configureSettingsOnStart}
        />

        {/* Success state */}
        {createdCreator ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Zap size={20} />
              </div>
              <div>
                <p className="font-semibold text-neutral-950">{createdCreator.name} is created.</p>
                <p className="mt-1 text-sm leading-6 text-neutral-500">
                  Your workspace URL is /{createdCreator.slug}.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Form steps */}
        {!createdCreator ? (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            {/* Step title */}
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-neutral-950">{getStepTitle(step)}</h1>
              <p className="mt-1 text-sm text-neutral-500">{getStepDescription(step)}</p>
            </div>

            {/* Identity step */}
            {step === 'identity' ? (
              <div className="grid gap-4">
                <TextField
                  label="Workspace name"
                  name="name"
                  maxLength={creatorConstraints.name.maxLength}
                  placeholder="Ana Studio"
                  value={values.name}
                  error={getError('name')}
                  onBlur={() => touchField('name')}
                  onChange={(e) => updateName(e.target.value)}
                />
                <TextField
                  label="URL slug"
                  name="slug"
                  maxLength={creatorConstraints.slug.maxLength}
                  placeholder="ana-studio"
                  value={values.slug}
                  error={getError('slug')}
                  onBlur={() => touchField('slug')}
                  onChange={(e) => updateField('slug', createSlug(e.target.value))}
                />
                <p className="text-xs text-neutral-400">
                  Your workspace will be available at /{values.slug || 'your-slug'}
                </p>
              </div>
            ) : null}

            {/* Plan step */}
            {step === 'plan' ? (
              <div>
                {creatorPlansStatus === 'loading' ? (
                  <div className="flex h-24 items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm text-neutral-400">
                    <Loader2 className="animate-spin" size={17} />
                    Loading plans
                  </div>
                ) : null}

                {creatorPlansStatus === 'error' ? (
                  <p className="text-sm text-red-600">{creatorPlansError}</p>
                ) : null}

                {creatorPlansStatus === 'success' ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {creatorPlans.map((plan) => {
                      const PlanIcon = getPlanIcon(plan.code)
                      const isSelected = values.planCode === plan.code
                      const isAvailable = plan.status.toLowerCase() === 'active'
                      const limits = formatPlanLimits(plan.limits)

                      return (
                        <button
                          key={plan.code}
                          className={`min-h-36 rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? 'border-neutral-950 bg-neutral-950 text-white'
                              : isAvailable
                                ? 'border-neutral-200 bg-white hover:border-neutral-300'
                                : 'cursor-not-allowed border-neutral-200 bg-neutral-100 opacity-50'
                          }`}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => updateField('planCode', plan.code)}
                        >
                          <div className="flex items-start justify-between">
                            <span
                              className={`grid size-9 place-items-center rounded-lg ${
                                isSelected ? 'bg-white/15' : 'bg-neutral-100'
                              }`}
                            >
                              <PlanIcon
                                size={18}
                                className={isSelected ? 'text-white' : 'text-neutral-600'}
                              />
                            </span>
                            {isSelected ? (
                              <span className="grid size-5 place-items-center rounded-full bg-white text-neutral-950">
                                <Check size={12} />
                              </span>
                            ) : (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  isSelected ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-500'
                                }`}
                              >
                                {plan.billingInterval === 'None' ? 'Free' : plan.billingInterval}
                              </span>
                            )}
                          </div>

                          <p className="mt-4 text-sm font-semibold">{plan.name}</p>
                          <p
                            className={`mt-0.5 text-sm font-medium ${isSelected ? 'text-white/70' : 'text-neutral-500'}`}
                          >
                            {formatPlanPrice(plan)}
                          </p>
                          {plan.description ? (
                            <p
                              className={`mt-2 text-xs leading-5 ${isSelected ? 'text-white/60' : 'text-neutral-400'}`}
                            >
                              {plan.description}
                            </p>
                          ) : null}
                          {limits.length > 0 ? (
                            <div
                              className={`mt-3 grid gap-0.5 text-xs ${isSelected ? 'text-white/60' : 'text-neutral-400'}`}
                            >
                              {limits.slice(0, 3).map((l) => (
                                <span key={l}>· {l}</span>
                              ))}
                            </div>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Setup step */}
            {step === 'setup' ? (
              <div className="grid gap-5">
                <div>
                  <p className="mb-3 text-sm font-medium text-neutral-700">Default currency</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['EUR', 'USD'] as const).map((currency) => (
                      <button
                        key={currency}
                        className={`h-11 rounded-xl border text-sm font-semibold transition ${
                          values.defaultCurrency === currency
                            ? 'border-neutral-950 bg-neutral-950 text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                        }`}
                        type="button"
                        onClick={() => updateField('defaultCurrency', currency)}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-neutral-700">Initial setup</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      {
                        value: false,
                        icon: Sparkles,
                        title: 'Use defaults',
                        desc: 'Start fast with clean defaults. Customize settings anytime later.',
                      },
                      {
                        value: true,
                        icon: Building2,
                        title: 'Configure now',
                        desc: 'Set brand name, colors, and email before creating the workspace.',
                      },
                    ] as const).map(({ value, icon: Icon, title, desc }) => {
                      const isSelected = values.configureSettingsOnStart === value
                      return (
                        <button
                          key={title}
                          className={`rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? 'border-neutral-950 bg-neutral-950 text-white'
                              : 'border-neutral-200 bg-white hover:border-neutral-300'
                          }`}
                          type="button"
                          onClick={() => updateField('configureSettingsOnStart', value)}
                        >
                          <Icon size={18} className={isSelected ? 'text-white' : 'text-neutral-500'} />
                          <p className="mt-3 text-sm font-semibold">{title}</p>
                          <p
                            className={`mt-1 text-xs leading-5 ${isSelected ? 'text-white/70' : 'text-neutral-500'}`}
                          >
                            {desc}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Settings step */}
            {step === 'settings' ? (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Brand name"
                    name="brandName"
                    maxLength={creatorConstraints.brandName.maxLength}
                    placeholder={values.name || 'Ana Studio'}
                    value={values.brandName}
                    error={getError('brandName')}
                    onBlur={() => touchField('brandName')}
                    onChange={(e) => updateField('brandName', e.target.value)}
                  />
                  <TextField
                    label="Support email"
                    name="supportEmail"
                    type="email"
                    inputMode="email"
                    maxLength={creatorConstraints.supportEmail.maxLength}
                    placeholder="hello@example.com"
                    value={values.supportEmail}
                    error={getError('supportEmail')}
                    onBlur={() => touchField('supportEmail')}
                    onChange={(e) => updateField('supportEmail', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                  <TextField
                    label="Logo URL"
                    name="logoUrl"
                    type="url"
                    maxLength={creatorConstraints.logoUrl.maxLength}
                    placeholder="https://example.com/logo.png"
                    value={values.logoUrl}
                    error={getError('logoUrl')}
                    onBlur={() => touchField('logoUrl')}
                    onChange={(e) => updateField('logoUrl', e.target.value)}
                  />
                  <label className="grid gap-2 text-sm font-medium text-neutral-700">
                    <span>Primary color</span>
                    <span className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3">
                      <input
                        className="size-6 cursor-pointer rounded-md border-0 bg-transparent p-0"
                        type="color"
                        value={values.primaryColor}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                      />
                      <input
                        className="min-w-0 flex-1 text-sm text-neutral-950 outline-none"
                        maxLength={creatorConstraints.primaryColor.maxLength}
                        value={values.primaryColor}
                        onBlur={() => touchField('primaryColor')}
                        onChange={(e) => updateField('primaryColor', e.target.value)}
                      />
                    </span>
                    {getError('primaryColor') ? (
                      <span className="text-xs text-red-600">{getError('primaryColor')}</span>
                    ) : null}
                  </label>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-neutral-700">Timezone</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(['Europe/Sarajevo', 'Europe/Berlin', 'America/New_York'] as const).map((tz) => (
                      <button
                        key={tz}
                        className={`rounded-xl border p-3 text-left transition ${
                          values.timezone === tz
                            ? 'border-neutral-950 bg-neutral-950 text-white'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                        type="button"
                        onClick={() => updateField('timezone', tz)}
                      >
                        <p className="text-sm font-semibold">{formatTimezoneLabel(tz)}</p>
                        <p className={`mt-0.5 text-xs ${values.timezone === tz ? 'text-white/60' : 'text-neutral-400'}`}>
                          {tz}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Review step */}
            {step === 'review' ? (
              <div className="grid gap-2">
                <ReviewRow label="Name" value={values.name.trim()} />
                <ReviewRow label="URL" value={`/${values.slug.trim()}`} />
                <ReviewRow label="Plan" value={selectedPlan?.name ?? values.planCode} />
                <ReviewRow label="Currency" value={values.defaultCurrency} />
                {values.configureSettingsOnStart ? (
                  <>
                    <ReviewRow label="Brand name" value={values.brandName.trim() || values.name.trim()} />
                    <ReviewRow label="Color" value={values.primaryColor} />
                    <ReviewRow label="Timezone" value={values.timezone} />
                  </>
                ) : (
                  <ReviewRow label="Settings" value="Defaults (edit anytime)" />
                )}

                {createError ? (
                  <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {createError}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Navigation */}
        {!createdCreator ? (
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={step === 'identity' || isSubmitting}
              onClick={goBack}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div>
              {step === 'identity' ? (
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  type="button"
                  onClick={goToPlan}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : null}

              {step === 'plan' ? (
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                  type="button"
                  disabled={creatorPlansStatus !== 'success' || !canContinueFromPlan}
                  onClick={goToSetup}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : null}

              {step === 'setup' ? (
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  type="button"
                  onClick={goToReview}
                >
                  {values.configureSettingsOnStart ? 'Configure settings' : 'Review'}
                  <ArrowRight size={16} />
                </button>
              ) : null}

              {step === 'settings' ? (
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  type="button"
                  onClick={goFromSettingsToReview}
                >
                  Review
                  <ArrowRight size={16} />
                </button>
              ) : null}

              {step === 'review' ? (
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void submitCreator()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Creating
                    </>
                  ) : (
                    <>
                      Create workspace
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-semibold text-neutral-950">{value}</span>
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────── */

function getStepTitle(step: CreatorStep) {
  switch (step) {
    case 'identity': return 'Name your workspace'
    case 'plan':     return 'Choose a plan'
    case 'setup':    return 'Initial setup'
    case 'settings': return 'Brand settings'
    case 'review':   return 'Review and create'
  }
}

function getStepDescription(step: CreatorStep) {
  switch (step) {
    case 'identity': return 'Give your workspace a name and a unique URL slug.'
    case 'plan':     return 'Select the plan that fits your current needs.'
    case 'setup':    return 'Set your default currency and decide on initial settings.'
    case 'settings': return 'Customize your brand before launching.'
    case 'review':   return 'Review all details before creating your workspace.'
  }
}

function formatTimezoneLabel(tz: string) {
  return tz.split('/').at(-1)?.replaceAll('_', ' ') ?? tz
}

function getPlanIcon(code: string) {
  switch (code) {
    case 'basic':  return Rocket
    case 'pro':    return Crown
    case 'plus':   return Building2
    default:       return Sparkles
  }
}

function formatPlanPrice(plan: CreatorPlan) {
  if (plan.priceCents <= 0) return 'Free'
  return `${plan.currency} ${(plan.priceCents / 100).toFixed(2)} / ${
    plan.billingInterval.toLowerCase() || 'month'
  }`
}

function formatPlanLimits(limits: CreatorPlan['limits']) {
  return Object.entries(limits).map(
    ([key, value]) =>
      `${formatLimitKey(key)}: ${value < 0 ? 'Unlimited' : value.toLocaleString()}`,
  )
}

function formatLimitKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}
