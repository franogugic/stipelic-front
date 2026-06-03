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

  const createCreatorProfile = useCreatorStore((s) => s.createCreatorProfile)
  const createStatus = useCreatorStore((s) => s.createStatus)
  const createError = useCreatorStore((s) => s.createError)
  const createdCreator = useCreatorStore((s) => s.createdCreator)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const creatorPlansStatus = useCreatorStore((s) => s.creatorPlansStatus)
  const creatorPlansError = useCreatorStore((s) => s.creatorPlansError)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)
  const resetCreateCreatorFeedback = useCreatorStore((s) => s.resetCreateCreatorFeedback)

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
      ...c, supportEmail: true, brandName: true, logoUrl: true, primaryColor: true, timezone: true,
    }))
    if (validation.isSettingsValid) setStep('review')
  }
  const goBack = () => {
    if (step === 'review')   { setStep(values.configureSettingsOnStart ? 'settings' : 'setup'); return }
    if (step === 'settings') { setStep('setup'); return }
    if (step === 'setup')    { setStep('plan'); return }
    if (step === 'plan')     { setStep('identity'); return }
  }

  const submitCreator = async () => {
    setTouchedFields({
      name: true, slug: true, planCode: true, defaultCurrency: true,
      configureSettingsOnStart: true, supportEmail: true, brandName: true,
      logoUrl: true, primaryColor: true, timezone: true, language: true,
    })
    if (!validation.isValid) return
    const result = await createCreatorProfile(values)
    if (result?.checkoutUrl) { window.location.assign(result.checkoutUrl); return }
    if (result) navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Minimal left branding strip */}
      <div className="hidden w-72 shrink-0 flex-col bg-neutral-950 px-8 py-10 lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-lg bg-white">
            <span className="text-xs font-black text-neutral-950">CP</span>
          </span>
          <span className="text-sm font-semibold text-white">Creator Platform</span>
        </div>

        <div className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
            New workspace
          </p>
          <div className="mt-6 grid gap-3">
            {[
              { step: 'identity', label: 'Name & URL' },
              { step: 'plan',     label: 'Choose plan' },
              { step: 'setup',    label: 'Initial setup' },
              ...(values.configureSettingsOnStart ? [{ step: 'settings', label: 'Brand settings' }] : []),
              { step: 'review',   label: 'Review' },
            ].map(({ step: s, label }, i) => {
              const steps: CreatorStep[] = ['identity', 'plan', 'setup', 'settings', 'review']
              const currentIndex = steps.indexOf(step)
              const thisIndex = steps.indexOf(s as CreatorStep)
              const isDone = thisIndex < currentIndex
              const isCurrent = s === step
              return (
                <div key={s} className="flex items-center gap-3">
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                      isDone
                        ? 'bg-white text-neutral-950'
                        : isCurrent
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-white/30'
                    }`}
                  >
                    {isDone ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </span>
                  <span
                    className={`text-sm transition ${
                      isCurrent ? 'font-semibold text-white' : isDone ? 'text-white/60' : 'text-white/30'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="grid size-7 place-items-center rounded-lg bg-neutral-950">
              <span className="text-xs font-black text-white">CP</span>
            </span>
            <span className="text-sm font-medium text-neutral-500">New workspace</span>
          </div>
          <span className="hidden text-sm font-medium text-neutral-500 lg:block">
            {getStepTitle(step)}
          </span>
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
            type="button"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={13} />
            Cancel
          </button>
        </header>

        {/* Mobile step indicator */}
        <div className="border-b border-neutral-200 bg-white px-6 py-3 lg:hidden">
          <CreatorStepIndicator currentStep={step} includeSettings={values.configureSettingsOnStart} />
        </div>

        <main className="flex-1 px-8 py-10">
          <div className="mx-auto w-full max-w-xl">
            {/* Success state */}
            {createdCreator ? (
              <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50">
                  <Zap className="text-emerald-600" size={28} strokeWidth={1.8} />
                </div>
                <h2 className="mt-6 text-xl font-semibold tracking-tight text-neutral-950">
                  Workspace created!
                </h2>
                <p className="mt-2.5 text-sm leading-6 text-neutral-500">
                  <span className="font-semibold text-neutral-950">{createdCreator.name}</span> is
                  ready at <span className="font-mono text-neutral-700">/{createdCreator.slug}</span>.
                </p>
                <button
                  className="mx-auto mt-8 flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  type="button"
                  onClick={() => navigate(`/app/${createdCreator.slug}`)}
                >
                  Open workspace
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : null}

            {!createdCreator ? (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">
                    {getStepTitle(step)}
                  </h1>
                  <p className="mt-1.5 text-sm text-neutral-500">{getStepDescription(step)}</p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
                  {/* ── Identity ── */}
                  {step === 'identity' ? (
                    <div className="grid gap-5">
                      <TextField
                        label="Workspace name"
                        name="name"
                        maxLength={creatorConstraints.name.maxLength}
                        placeholder="Ana Studio"
                        value={values.name}
                        error={getError('name')}
                        hint="The public name of your creator workspace."
                        onBlur={() => touchField('name')}
                        onChange={(e) => updateName(e.target.value)}
                      />
                      <div>
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
                        <p className="mt-2 text-xs text-neutral-400">
                          Your workspace URL:{' '}
                          <span className="font-mono text-neutral-600">
                            creatorplatform.io/{values.slug || 'your-slug'}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* ── Plan ── */}
                  {step === 'plan' ? (
                    <div>
                      {creatorPlansStatus === 'loading' ? (
                        <div className="flex h-24 items-center justify-center gap-3 text-sm text-neutral-400">
                          <Loader2 className="animate-spin" size={16} />
                          Loading plans…
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
                                      ? 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                                      : 'cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-50'
                                }`}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => updateField('planCode', plan.code)}
                              >
                                <div className="flex items-start justify-between">
                                  <span className={`grid size-8 place-items-center rounded-lg ${isSelected ? 'bg-white/15' : 'bg-neutral-100'}`}>
                                    <PlanIcon size={16} className={isSelected ? 'text-white' : 'text-neutral-600'} />
                                  </span>
                                  {isSelected ? (
                                    <span className="grid size-5 place-items-center rounded-full bg-white">
                                      <Check size={11} className="text-neutral-950" />
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                                      {plan.billingInterval === 'None' ? 'Free' : plan.billingInterval}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-4 text-sm font-semibold">{plan.name}</p>
                                <p className={`mt-0.5 text-sm ${isSelected ? 'text-white/60' : 'text-neutral-500'}`}>
                                  {formatPlanPrice(plan)}
                                </p>
                                {limits.length > 0 ? (
                                  <ul className={`mt-3 grid gap-0.5 text-xs ${isSelected ? 'text-white/50' : 'text-neutral-400'}`}>
                                    {limits.slice(0, 3).map((l) => <li key={l}>· {l}</li>)}
                                  </ul>
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* ── Setup ── */}
                  {step === 'setup' ? (
                    <div className="grid gap-6">
                      <div>
                        <p className="mb-3 text-sm font-medium text-neutral-700">Default currency</p>
                        <div className="grid grid-cols-3 gap-2">
                          {(['EUR', 'USD', 'GBP'] as const).map((currency) => (
                            <button
                              key={currency}
                              className={`h-10 rounded-xl border text-sm font-semibold transition ${
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
                        <p className="mb-3 text-sm font-medium text-neutral-700">Initial configuration</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {([
                            { value: false, icon: Sparkles, title: 'Quick start', desc: 'Start with clean defaults. Customize branding later from settings.' },
                            { value: true,  icon: Building2, title: 'Custom branding', desc: 'Set your brand name, colours, and support email before launching.' },
                          ] as const).map(({ value, icon: Icon, title, desc }) => {
                            const isSelected = values.configureSettingsOnStart === value
                            return (
                              <button
                                key={title}
                                className={`rounded-xl border p-4 text-left transition ${
                                  isSelected
                                    ? 'border-neutral-950 bg-neutral-950 text-white'
                                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                                }`}
                                type="button"
                                onClick={() => updateField('configureSettingsOnStart', value)}
                              >
                                <Icon size={16} className={isSelected ? 'text-white' : 'text-neutral-500'} />
                                <p className="mt-3 text-sm font-semibold">{title}</p>
                                <p className={`mt-1 text-xs leading-5 ${isSelected ? 'text-white/60' : 'text-neutral-400'}`}>{desc}</p>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* ── Settings ── */}
                  {step === 'settings' ? (
                    <div className="grid gap-5">
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
                      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
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
                        <div className="grid gap-1.5">
                          <label className="text-sm font-medium text-neutral-700">Primary colour</label>
                          <span className="flex h-[42px] items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 transition focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-100">
                            <input
                              className="size-6 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
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
                            <p className="text-xs text-red-600">{getError('primaryColor')}</p>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <p className="mb-3 text-sm font-medium text-neutral-700">Timezone</p>
                        <div className="grid gap-2 sm:grid-cols-3">
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
                              <p className={`mt-0.5 text-xs ${values.timezone === tz ? 'text-white/50' : 'text-neutral-400'}`}>{tz}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* ── Review ── */}
                  {step === 'review' ? (
                    <div className="grid gap-2">
                      <ReviewRow label="Workspace name" value={values.name.trim()} />
                      <ReviewRow label="URL slug" value={`/${values.slug.trim()}`} />
                      <ReviewRow label="Plan" value={selectedPlan?.name ?? values.planCode} />
                      <ReviewRow label="Currency" value={values.defaultCurrency} />
                      {values.configureSettingsOnStart ? (
                        <>
                          <ReviewRow label="Brand name" value={values.brandName.trim() || values.name.trim()} />
                          <ReviewRow label="Primary colour" value={values.primaryColor} />
                          <ReviewRow label="Timezone" value={values.timezone} />
                        </>
                      ) : (
                        <ReviewRow label="Brand settings" value="Using defaults — edit anytime" />
                      )}

                      {selectedPlan && selectedPlan.priceCents > 0 ? (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          After creating, you'll be redirected to Stripe to complete payment for the{' '}
                          <strong>{selectedPlan.name}</strong> plan ({formatPlanPrice(selectedPlan)}).
                        </div>
                      ) : null}

                      {createError ? (
                        <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {createError}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    disabled={step === 'identity' || isSubmitting}
                    onClick={goBack}
                  >
                    <ArrowLeft size={15} />
                    Back
                  </button>

                  {step === 'identity' ? (
                    <button className={primaryBtn} type="button" onClick={goToPlan}>
                      Continue <ArrowRight size={15} />
                    </button>
                  ) : null}
                  {step === 'plan' ? (
                    <button className={primaryBtn} type="button" disabled={creatorPlansStatus !== 'success' || !canContinueFromPlan} onClick={goToSetup}>
                      Continue <ArrowRight size={15} />
                    </button>
                  ) : null}
                  {step === 'setup' ? (
                    <button className={primaryBtn} type="button" onClick={goToReview}>
                      {values.configureSettingsOnStart ? 'Configure branding' : 'Review'} <ArrowRight size={15} />
                    </button>
                  ) : null}
                  {step === 'settings' ? (
                    <button className={primaryBtn} type="button" onClick={goFromSettingsToReview}>
                      Review <ArrowRight size={15} />
                    </button>
                  ) : null}
                  {step === 'review' ? (
                    <button className={primaryBtn} type="button" disabled={isSubmitting} onClick={() => void submitCreator()}>
                      {isSubmitting ? (
                        <><Loader2 className="animate-spin" size={15} /> Creating…</>
                      ) : (
                        <>Create workspace <ArrowRight size={15} /></>
                      )}
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}

const primaryBtn =
  'inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40'

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
    case 'review':   return 'Review & create'
  }
}

function getStepDescription(step: CreatorStep) {
  switch (step) {
    case 'identity': return 'Give your workspace a name and a unique URL slug.'
    case 'plan':     return 'Select the plan that fits your current needs. You can upgrade anytime.'
    case 'setup':    return 'Set your billing currency and choose how to start.'
    case 'settings': return 'Customize your brand before the workspace goes live.'
    case 'review':   return 'Review everything before creating your workspace.'
  }
}

function formatTimezoneLabel(tz: string) {
  return tz.split('/').at(-1)?.replaceAll('_', ' ') ?? tz
}

function getPlanIcon(code: string) {
  switch (code) {
    case 'basic': return Rocket
    case 'pro':   return Crown
    case 'plus':  return Building2
    default:      return Sparkles
  }
}

function formatPlanPrice(plan: CreatorPlan) {
  if (plan.priceCents <= 0) return 'Free forever'
  return `€${(plan.priceCents / 100).toFixed(0)} / ${plan.billingInterval.toLowerCase() || 'month'}`
}

function formatPlanLimits(limits: CreatorPlan['limits']) {
  return Object.entries(limits).map(
    ([key, value]) => `${formatLimitKey(key)}: ${value < 0 ? 'Unlimited' : value.toLocaleString()}`,
  )
}

function formatLimitKey(key: string) {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}
