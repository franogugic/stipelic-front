import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Crown,
  Loader2,
  Lock,
  Rocket,
  Settings,
  Sparkles,
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
    () => creatorPlans.find((plan) => plan.code === values.planCode),
    [creatorPlans, values.planCode],
  )
  const isSubmitting = createStatus === 'submitting'

  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])

  const updateField = <TField extends keyof CreateCreatorFormValues>(
    fieldName: TField,
    value: CreateCreatorFormValues[TField],
  ) => {
    resetCreateCreatorFeedback()
    setValues((current) => ({ ...current, [fieldName]: value }))
  }

  const updateName = (value: string) => {
    resetCreateCreatorFeedback()
    setValues((current) => ({
      ...current,
      name: value,
      slug: current.slug ? current.slug : createSlug(value),
    }))
  }

  const touchField = (fieldName: keyof CreateCreatorFormValues) => {
    setTouchedFields((current) => ({ ...current, [fieldName]: true }))
  }

  const getVisibleError = (fieldName: keyof CreateCreatorFormValues) =>
    touchedFields[fieldName] ? validation.fieldErrors[fieldName] : undefined

  const goToPlan = () => {
    setTouchedFields((current) => ({ ...current, name: true, slug: true }))
    if (validation.isIdentityValid) {
      setStep('plan')
    }
  }

  const goToSetup = () => {
    setTouchedFields((current) => ({ ...current, planCode: true }))
    if (validation.isPlanValid) {
      setStep('setup')
    }
  }

  const goToReview = () => {
    setTouchedFields((current) => ({ ...current, defaultCurrency: true }))
    if (validation.isSetupValid) {
      setStep(values.configureSettingsOnStart ? 'settings' : 'review')
    }
  }

  const goFromSettingsToReview = () => {
    setTouchedFields((current) => ({
      ...current,
      supportEmail: true,
      brandName: true,
      logoUrl: true,
      primaryColor: true,
      timezone: true,
      language: true,
    }))

    if (validation.isSettingsValid) {
      setStep('review')
    }
  }

  const submitCreator = async () => {
    setTouchedFields({
      name: true,
      slug: true,
      planCode: true,
      defaultCurrency: true,
      configureSettingsOnStart: true,
      supportEmail: true,
      brandName: true,
      logoUrl: true,
      primaryColor: true,
      timezone: true,
      language: true,
    })
    if (!validation.isValid) {
      return
    }

    const creator = await createCreatorProfile(values)
    if (creator) {
      navigate('/')
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-neutral-950">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-8 lg:px-8">
        <section className="w-full rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-500">Creator Platform</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Create creator
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-500">
                Set up the workspace that will own landing pages, stats, products, and offers.
              </p>
            </div>

            <button
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
              type="button"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={16} />
              Home
            </button>
          </div>

          <CreatorStepIndicator
            currentStep={step}
            includeSettings={values.configureSettingsOnStart}
          />

          <div className="mt-8">
            {createdCreator ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 shrink-0" size={24} />
                  <div>
                    <h2 className="text-xl font-semibold tracking-normal">
                      {createdCreator.name} is ready.
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-emerald-800">
                      Your creator URL is /{createdCreator.slug}. Landing page setup comes next.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {!createdCreator && step === 'identity' ? (
              <div className="grid gap-5">
                <TextField
                  label="Creator name"
                  name="name"
                  maxLength={creatorConstraints.name.maxLength}
                  placeholder="Ana Studio"
                  value={values.name}
                  error={getVisibleError('name')}
                  onBlur={() => touchField('name')}
                  onChange={(event) => updateName(event.target.value)}
                />

                <TextField
                  label="Creator URL"
                  name="slug"
                  maxLength={creatorConstraints.slug.maxLength}
                  placeholder="ana-studio"
                  value={values.slug}
                  error={getVisibleError('slug')}
                  onBlur={() => touchField('slug')}
                  onChange={(event) => updateField('slug', createSlug(event.target.value))}
                />
              </div>
            ) : null}

            {!createdCreator && step === 'plan' ? (
              <div className="grid gap-5">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Plan</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {creatorPlansStatus === 'loading' ? (
                      <div className="flex min-h-36 items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-500 sm:col-span-2">
                        <Loader2 className="animate-spin" size={18} />
                        Loading creator plans
                      </div>
                    ) : null}

                    {creatorPlansStatus === 'error' ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 sm:col-span-2">
                        {creatorPlansError}
                      </div>
                    ) : null}

                    {creatorPlans.map((plan) => {
                      const Icon = getPlanIcon(plan.code)
                      const isSelected = values.planCode === plan.code
                      const isAvailable = plan.code === 'free'
                      const limits = formatPlanLimits(plan.limits)

                      return (
                        <button
                          className={`min-h-36 rounded-2xl border p-4 text-left transition ${
                            isSelected
                              ? 'border-neutral-950 bg-neutral-950 text-white'
                              : isAvailable
                                ? 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-300'
                                : 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400'
                          }`}
                          key={plan.code}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => updateField('planCode', plan.code)}
                        >
                          <span className="flex items-start justify-between gap-3">
                            <span
                              className={`grid size-10 place-items-center rounded-xl ${
                                isSelected
                                  ? 'bg-white text-neutral-950'
                                  : isAvailable
                                    ? 'bg-neutral-100 text-neutral-700'
                                    : 'bg-white text-neutral-300'
                              }`}
                            >
                              <Icon size={19} />
                            </span>
                            {isAvailable ? (
                              <span
                                className={`grid size-6 place-items-center rounded-full ${
                                  isSelected
                                    ? 'bg-white text-neutral-950'
                                    : 'bg-neutral-100 text-neutral-500'
                                }`}
                              >
                                <Check size={14} />
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-neutral-400">
                                <Lock size={12} />
                                Locked
                              </span>
                            )}
                          </span>
                          <span className="mt-4 block text-sm font-semibold">{plan.name}</span>
                          <span
                            className={`mt-1 block text-sm ${
                              isSelected ? 'text-white/70' : 'text-neutral-500'
                            }`}
                          >
                            {formatPlanPrice(plan)}
                          </span>
                          <span
                            className={`mt-3 block text-sm leading-5 ${
                              isSelected ? 'text-white/70' : 'text-neutral-500'
                            }`}
                          >
                            {plan.description ??
                              'Clean starter plan for your first creator workspace.'}
                          </span>
                          {limits.length > 0 ? (
                            <span
                              className={`mt-3 grid gap-1 text-xs ${
                                isSelected ? 'text-white/70' : 'text-neutral-500'
                              }`}
                            >
                              {limits.slice(0, 3).map((limit) => (
                                <span key={limit}>- {limit}</span>
                              ))}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {!createdCreator && step === 'setup' ? (
              <div className="grid gap-5">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Default currency</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {(['EUR', 'USD'] as const).map((currency) => (
                      <button
                        className={`h-12 rounded-xl border px-4 text-sm font-semibold transition ${
                          values.defaultCurrency === currency
                            ? 'border-neutral-950 bg-neutral-950 text-white'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                        }`}
                        key={currency}
                        type="button"
                        onClick={() => updateField('defaultCurrency', currency)}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Settings on start
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <button
                      className={`rounded-2xl border p-4 text-left transition ${
                        values.configureSettingsOnStart
                          ? 'border-neutral-950 bg-neutral-950 text-white'
                          : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-300'
                      }`}
                      type="button"
                      onClick={() => updateField('configureSettingsOnStart', true)}
                    >
                      <Settings size={19} />
                      <span className="mt-3 block text-sm font-semibold">
                        Choose settings now
                      </span>
                      <span
                        className={`mt-2 block text-sm leading-5 ${
                          values.configureSettingsOnStart ? 'text-white/70' : 'text-neutral-500'
                        }`}
                      >
                        Go into settings after creation and tune the creator workspace.
                      </span>
                    </button>

                    <button
                      className={`rounded-2xl border p-4 text-left transition ${
                        !values.configureSettingsOnStart
                          ? 'border-neutral-950 bg-neutral-950 text-white'
                          : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-300'
                      }`}
                      type="button"
                      onClick={() => updateField('configureSettingsOnStart', false)}
                    >
                      <Sparkles size={19} />
                      <span className="mt-3 block text-sm font-semibold">
                        Use starter defaults
                      </span>
                      <span
                        className={`mt-2 block text-sm leading-5 ${
                          !values.configureSettingsOnStart ? 'text-white/70' : 'text-neutral-500'
                        }`}
                      >
                        Create faster with clean defaults and adjust settings later.
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {!createdCreator && step === 'settings' ? (
              <div className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Brand name"
                    name="brandName"
                    maxLength={creatorConstraints.brandName.maxLength}
                    placeholder={values.name || 'Ana Studio'}
                    value={values.brandName}
                    error={getVisibleError('brandName')}
                    onBlur={() => touchField('brandName')}
                    onChange={(event) => updateField('brandName', event.target.value)}
                  />

                  <TextField
                    label="Support email"
                    name="supportEmail"
                    type="email"
                    inputMode="email"
                    maxLength={creatorConstraints.supportEmail.maxLength}
                    placeholder="hello@example.com"
                    value={values.supportEmail}
                    error={getVisibleError('supportEmail')}
                    onBlur={() => touchField('supportEmail')}
                    onChange={(event) => updateField('supportEmail', event.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                  <TextField
                    label="Logo URL"
                    name="logoUrl"
                    type="url"
                    maxLength={creatorConstraints.logoUrl.maxLength}
                    placeholder="https://example.com/logo.png"
                    value={values.logoUrl}
                    error={getVisibleError('logoUrl')}
                    onBlur={() => touchField('logoUrl')}
                    onChange={(event) => updateField('logoUrl', event.target.value)}
                  />

                  <label className="grid gap-2 text-sm font-medium text-neutral-900">
                    <span>Primary color</span>
                    <span className="flex h-12 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3">
                      <input
                        className="size-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
                        type="color"
                        value={values.primaryColor}
                        onChange={(event) => updateField('primaryColor', event.target.value)}
                      />
                      <input
                        className="min-w-0 flex-1 text-[15px] text-neutral-950 outline-none"
                        maxLength={creatorConstraints.primaryColor.maxLength}
                        value={values.primaryColor}
                        onBlur={() => touchField('primaryColor')}
                        onChange={(event) => updateField('primaryColor', event.target.value)}
                      />
                    </span>
                    {getVisibleError('primaryColor') ? (
                      <span className="text-xs font-medium text-red-600">
                        {getVisibleError('primaryColor')}
                      </span>
                    ) : null}
                  </label>
                </div>

                <div>
                  <p className="text-sm font-semibold text-neutral-900">Timezone</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {(['Europe/Sarajevo', 'Europe/Berlin', 'America/New_York'] as const).map(
                      (timezone) => (
                        <button
                          className={`rounded-2xl border p-4 text-left transition ${
                            values.timezone === timezone
                              ? 'border-neutral-950 bg-neutral-950 text-white'
                              : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-300'
                          }`}
                          key={timezone}
                          type="button"
                          onClick={() => updateField('timezone', timezone)}
                        >
                          <span className="block text-sm font-semibold">
                            {formatTimezoneLabel(timezone)}
                          </span>
                          <span
                            className={`mt-2 block text-sm leading-5 ${
                              values.timezone === timezone
                                ? 'text-white/70'
                                : 'text-neutral-500'
                            }`}
                          >
                            {timezone}
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-900">Language</p>
                  <p className="mt-2 text-sm leading-5 text-neutral-500">English</p>
                </div>
              </div>
            ) : null}

            {!createdCreator && step === 'review' ? (
              <div className="grid gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <ReviewRow label="Name" value={values.name.trim()} />
                <ReviewRow label="URL" value={`/${values.slug.trim()}`} />
                <ReviewRow label="Plan" value={selectedPlan?.name ?? values.planCode} />
                <ReviewRow label="Currency" value={values.defaultCurrency} />
                <ReviewRow
                  label="Settings"
                  value={values.configureSettingsOnStart ? 'Choose now' : 'Starter defaults'}
                />
                {values.configureSettingsOnStart ? (
                  <>
                    <ReviewRow
                      label="Brand name"
                      value={values.brandName.trim() || values.name.trim()}
                    />
                    <ReviewRow
                      label="Support email"
                      value={values.supportEmail.trim() || 'Not shown'}
                    />
                    <ReviewRow
                      label="Logo URL"
                      value={values.logoUrl.trim() || 'No logo yet'}
                    />
                    <ReviewRow label="Primary color" value={values.primaryColor} />
                    <ReviewRow label="Timezone" value={values.timezone} />
                    <ReviewRow label="Language" value="English" />
                  </>
                ) : null}

                {createError ? (
                  <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {createError}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {!createdCreator ? (
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={step === 'identity' || isSubmitting}
                onClick={() => {
                  if (step === 'review') {
                    setStep(values.configureSettingsOnStart ? 'settings' : 'setup')
                    return
                  }

                  if (step === 'settings') {
                    setStep('setup')
                    return
                  }

                  if (step === 'setup') {
                    setStep('plan')
                    return
                  }

                  setStep('identity')
                }}
              >
                <ArrowLeft size={18} />
                Back
              </button>

              {step === 'identity' ? (
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  type="button"
                  onClick={goToPlan}
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              ) : null}

              {step === 'plan' ? (
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                  type="button"
                  disabled={creatorPlansStatus === 'loading' || creatorPlansStatus === 'error'}
                  onClick={goToSetup}
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              ) : null}

              {step === 'setup' ? (
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  type="button"
                  onClick={goToReview}
                >
                  Review
                  <ArrowRight size={18} />
                </button>
              ) : null}

              {step === 'settings' ? (
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  type="button"
                  onClick={goFromSettingsToReview}
                >
                  Review
                  <ArrowRight size={18} />
                </button>
              ) : null}

              {step === 'review' ? (
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    void submitCreator()
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Creating
                    </>
                  ) : (
                    <>
                      Create creator
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3">
      <span className="text-sm font-medium text-neutral-500">{label}</span>
      <span className="text-sm font-semibold text-neutral-950">{value}</span>
    </div>
  )
}

function formatTimezoneLabel(timezone: string) {
  return timezone.split('/').at(-1)?.replaceAll('_', ' ') ?? timezone
}

function getPlanIcon(code: string) {
  switch (code) {
    case 'starter':
      return Rocket
    case 'pro':
      return Crown
    case 'studio':
      return Building2
    case 'free':
    default:
      return Sparkles
  }
}

function formatPlanPrice(plan: CreatorPlan) {
  if (plan.priceCents <= 0) {
    return `${plan.currency} 0`
  }

  return `${plan.currency} ${(plan.priceCents / 100).toFixed(2)} / ${formatBillingInterval(
    plan.billingInterval,
  )}`
}

function formatBillingInterval(interval: string) {
  return interval.trim().toLowerCase() || 'month'
}

function formatPlanLimits(limits: CreatorPlan['limits']) {
  return Object.entries(limits).map(
    ([key, value]) => `${formatLimitKey(key)}: ${formatLimitValue(value)}`,
  )
}

function formatLimitKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatLimitValue(value: number) {
  return value < 0 ? 'Unlimited' : value.toLocaleString()
}
