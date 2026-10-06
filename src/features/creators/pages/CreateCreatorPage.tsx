import { ArrowLeft, ArrowRight, Check, CircleAlert, Landmark } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { money, number, percent } from '../../../shared/lib/format'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import {
  Alert,
  Badge,
  Brand,
  Button,
  ColorField,
  Field,
  Input,
  InputAddon,
  InputGroup,
  Segmented,
  Select,
} from '../../../shared/ui/ledger'
import { createSlug, validateCreateCreatorForm } from '../model/create-creator-validation'
import type { CreateCreatorFieldName } from '../model/create-creator-validation'
import { useCreatorStore } from '../model/creator-store'
import { usePayoutStore } from '../model/payout-store'
import type { CreateCreatorFormValues, CreatorPlan, PayoutMode } from '../model/types'

/** The API has no "recommended" flag; the prototype marks Pro. */
const RECOMMENDED_PLAN_CODE = 'pro'

const DEFAULT_PRIMARY_COLOR = '#111827'

const STEPS = ['Name & link', 'Choose plan', 'Make it yours'] as const
type Step = 1 | 2 | 3

const STEP_FIELDS: Record<Step, CreateCreatorFieldName[]> = {
  1: ['name', 'slug', 'countryCode'],
  2: ['planCode'],
  3: ['supportEmail', 'brandName', 'primaryColor', 'defaultCurrency'],
}

/** The API's code for a create that failed because the address is taken. */
const SLUG_TAKEN_CODE = 'CREATOR_SLUG_TAKEN'

const regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' })

function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Sarajevo'
  } catch {
    return 'Europe/Sarajevo'
  }
}

const initialValues: CreateCreatorFormValues = {
  name: '',
  slug: '',
  planCode: RECOMMENDED_PLAN_CODE,
  defaultCurrency: 'EUR',
  countryCode: '',
  configureSettingsOnStart: false,
  supportEmail: '',
  brandName: '',
  logoUrl: '',
  primaryColor: DEFAULT_PRIMARY_COLOR,
  timezone: browserTimezone(),
  language: 'en',
}

/** New workspace in three steps: name & link, plan, optional branding. */
export function CreateCreatorPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [values, setValues] = useState<CreateCreatorFormValues>(initialValues)
  const [touched, setTouched] = useState<Partial<Record<CreateCreatorFieldName, boolean>>>({})
  const [slugTakenError, setSlugTakenError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const createCreatorProfile = useCreatorStore((s) => s.createCreatorProfile)
  const createStatus = useCreatorStore((s) => s.createStatus)
  const createError = useCreatorStore((s) => s.createError)
  const resetCreateCreatorFeedback = useCreatorStore((s) => s.resetCreateCreatorFeedback)
  const startCreatorCheckout = useCreatorStore((s) => s.startCreatorCheckout)
  const checkoutError = useCreatorStore((s) => s.checkoutError)
  const creatorPlans = useCreatorStore((s) => s.creatorPlans)
  const creatorPlansError = useCreatorStore((s) => s.creatorPlansError)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)

  const payoutCountries = usePayoutStore((s) => s.payoutCountries)
  const loadPayoutCountries = usePayoutStore((s) => s.loadPayoutCountries)

  useDocumentTitle('Create workspace · Luma')

  useEffect(() => {
    void loadCreatorPlans()
    void loadPayoutCountries()
  }, [loadCreatorPlans, loadPayoutCountries])

  // The store outlives the page: never start with a previous attempt's error.
  useEffect(() => {
    resetCreateCreatorFeedback()
  }, [resetCreateCreatorFeedback])

  const countries = useMemo(
    () =>
      payoutCountries
        .map((country) => ({ ...country, name: regionDisplayNames.of(country.code) ?? country.code }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [payoutCountries],
  )
  const selectedCountry = countries.find((country) => country.code === values.countryCode)
  const activePlans = creatorPlans.filter((plan) => plan.status.toLowerCase() === 'active')

  // Step 3 counts as configured when anything there was filled in or changed.
  const configureSettingsOnStart =
    values.brandName.trim() !== '' ||
    values.supportEmail.trim() !== '' ||
    values.primaryColor.trim().toUpperCase() !== DEFAULT_PRIMARY_COLOR.toUpperCase()

  const validation = useMemo(
    () => validateCreateCreatorForm({ ...values, configureSettingsOnStart }),
    [values, configureSettingsOnStart],
  )
  const fieldError = (field: CreateCreatorFieldName) =>
    touched[field] ? validation.fieldErrors[field] : undefined
  const isSubmitting = createStatus === 'submitting' || isRedirecting

  const update = <TField extends CreateCreatorFieldName>(field: TField, value: CreateCreatorFormValues[TField]) => {
    resetCreateCreatorFeedback()
    if (field === 'slug') setSlugTakenError(null)
    setValues((current) => ({ ...current, [field]: value }))
  }

  // The address follows the name until it is edited by hand.
  const updateName = (name: string) => {
    resetCreateCreatorFeedback()
    setValues((current) => ({
      ...current,
      name,
      slug: current.slug === createSlug(current.name) ? createSlug(name) : current.slug,
    }))
  }

  const touch = (field: CreateCreatorFieldName) => setTouched((current) => ({ ...current, [field]: true }))
  const touchStep = (target: Step) =>
    setTouched((current) => ({ ...current, ...Object.fromEntries(STEP_FIELDS[target].map((field) => [field, true])) }))
  const isStepValid = (target: Step) =>
    STEP_FIELDS[target].every((field) => !validation.fieldErrors[field]) && (target !== 1 || !slugTakenError)

  const goForward = () => {
    touchStep(step)
    if (!isStepValid(step)) return
    resetCreateCreatorFeedback()
    setStep((current) => (current < 3 ? ((current + 1) as Step) : current))
  }

  const goBack = () => {
    resetCreateCreatorFeedback()
    setStep((current) => (current > 1 ? ((current - 1) as Step) : current))
  }

  const create = async (withSettings: boolean) => {
    if (withSettings) {
      touchStep(3)
      if (!isStepValid(3)) return
    }

    const payload: CreateCreatorFormValues = withSettings
      ? { ...values, configureSettingsOnStart }
      : { ...values, configureSettingsOnStart: false, defaultCurrency: 'EUR' }

    const result = await createCreatorProfile(payload)
    if (!result) {
      const { createErrorCode, createError: message } = useCreatorStore.getState()
      // A taken address goes back to where it can be fixed.
      if (createErrorCode === SLUG_TAKEN_CODE) {
        resetCreateCreatorFeedback()
        setSlugTakenError(message)
        setTouched((current) => ({ ...current, slug: true }))
        setStep(1)
      }
      return
    }

    if (!result.requiresPayment) {
      navigate('/', { replace: true })
      return
    }

    // A paid plan pays first; the workspace stays pending until Stripe confirms.
    setIsRedirecting(true)
    const checkoutUrl = (await startCreatorCheckout())?.checkoutUrl
    if (checkoutUrl) {
      window.location.assign(checkoutUrl)
      return
    }
    setIsRedirecting(false)
    navigate(`/app/${result.creator.slug}`, { replace: true })
  }

  const apiError = createError ?? (step === 2 ? creatorPlansError : null) ?? checkoutError

  const heading: Record<Step, { title: ReactNode; text: string }> = {
    1: { title: <>Name your <em>workspace</em></>, text: 'This is the name and address your customers will see.' },
    2: { title: <>Choose your <em>plan</em></>, text: 'You can change it any time. Lower plans take a bigger fee per sale.' },
    3: { title: <>Make it <em>yours</em></>, text: 'Optional — you can change all of this later in Settings.' },
  }

  return (
    <div className="center-card" style={{ placeItems: 'start center' }}>
      <div className="stack stack--xl" style={{ width: 'min(960px, 100%)', paddingTop: 'var(--space-10)' }}>
        <div className="cluster cluster--between">
          <Brand to="/" />
          <span className="text-sm text-muted">Step {step} of 3</span>
        </div>

        <ol className="stepper" role="list">
          {STEPS.map((label, index) => {
            const stepNumber = index + 1
            const state =
              stepNumber < step ? 'stepper__step--done' : stepNumber === step ? 'stepper__step--current' : undefined
            return (
              <li
                key={label}
                className={['stepper__step', state].filter(Boolean).join(' ')}
                aria-current={stepNumber === step ? 'step' : undefined}
              >
                {label}
              </li>
            )
          })}
        </ol>

        <div className="stack stack--sm">
          <h1 className="page-title">{heading[step].title}</h1>
          <p className="text-secondary">{heading[step].text}</p>
        </div>

        {apiError ? (
          <Alert tone="danger" icon={CircleAlert} live>
            <p>{apiError}</p>
          </Alert>
        ) : null}

        {step === 1 && (
          <form
            className="form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              goForward()
            }}
          >
            <Field label="Workspace name" error={fieldError('name')}>
              {(control) => (
                <Input
                  {...control}
                  name="name"
                  autoComplete="organization"
                  value={values.name}
                  onBlur={() => touch('name')}
                  onChange={(event) => updateName(event.target.value)}
                />
              )}
            </Field>
            <Field
              label="Your address"
              hint="Lowercase letters, numbers and dashes."
              error={slugTakenError ?? fieldError('slug')}
            >
              {(control) => (
                <InputGroup>
                  <InputAddon>{window.location.host}/p/</InputAddon>
                  <Input
                    {...control}
                    className="mono"
                    name="slug"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={values.slug}
                    onBlur={() => touch('slug')}
                    onChange={(event) => update('slug', event.target.value)}
                  />
                </InputGroup>
              )}
            </Field>
            <Field label="Country" hint="Decides how your earnings are paid out." error={fieldError('countryCode')}>
              {(control) => (
                <Select
                  {...control}
                  name="countryCode"
                  value={values.countryCode}
                  onBlur={() => touch('countryCode')}
                  onChange={(event) => update('countryCode', event.target.value)}
                >
                  <option value="" disabled>
                    Select your country
                  </option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {/* Enter submits the step. */}
            <button type="submit" hidden />
          </form>
        )}

        {step === 2 && (
          <>
            <div className="plans">
              {activePlans.map((plan) => (
                <PlanCard
                  key={plan.code}
                  plan={plan}
                  checked={values.planCode === plan.code}
                  onSelect={() => update('planCode', plan.code)}
                />
              ))}
            </div>
            {selectedCountry && <PayoutAlert country={selectedCountry.name} payoutMode={selectedCountry.payoutMode} />}
          </>
        )}

        {step === 3 && (
          <form
            className="form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void create(true)
            }}
          >
            <Field label="Brand name" error={fieldError('brandName')}>
              {(control) => (
                <Input
                  {...control}
                  name="brandName"
                  placeholder={values.name.trim()}
                  value={values.brandName}
                  onBlur={() => touch('brandName')}
                  onChange={(event) => update('brandName', event.target.value)}
                />
              )}
            </Field>
            <Field label="Support email" hint="Used as reply-to for campaigns." error={fieldError('supportEmail')}>
              {(control) => (
                <Input
                  {...control}
                  type="email"
                  name="supportEmail"
                  autoComplete="email"
                  inputMode="email"
                  value={values.supportEmail}
                  onBlur={() => touch('supportEmail')}
                  onChange={(event) => update('supportEmail', event.target.value)}
                />
              )}
            </Field>
            <Field label="Primary colour" error={fieldError('primaryColor')}>
              {(control) => (
                <ColorField
                  id={control.id}
                  value={values.primaryColor}
                  onChange={(value) => update('primaryColor', value)}
                />
              )}
            </Field>
            <Field label="Currency" error={fieldError('defaultCurrency')}>
              {() => (
                <Segmented
                  label="Currency"
                  options={[
                    { value: 'EUR', label: 'EUR' },
                    { value: 'USD', label: 'USD' },
                  ]}
                  value={values.defaultCurrency}
                  onChange={(value) => update('defaultCurrency', value === 'USD' ? 'USD' : 'EUR')}
                />
              )}
            </Field>
            <p className="text-sm text-muted">You can add your logo later in Settings.</p>
            <button type="submit" hidden />
          </form>
        )}

        <div className="cluster cluster--between">
          {step > 1 ? (
            <Button variant="ghost" icon={ArrowLeft} onClick={goBack} disabled={isSubmitting}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button variant="primary" icon={ArrowRight} onClick={goForward}>
              Continue
            </Button>
          ) : (
            <div className="cluster">
              <Button variant="ghost" onClick={() => void create(false)} disabled={isSubmitting}>
                Skip
              </Button>
              <Button variant="accent" icon={Check} loading={isSubmitting} onClick={() => void create(true)}>
                Create workspace
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PlanCard({ plan, checked, onSelect }: { plan: CreatorPlan; checked: boolean; onSelect: () => void }) {
  const limit = (key: string) => plan.limits[key]
  const count = (key: string) => {
    const value = limit(key)
    return value === undefined || value < 0 ? 'Unlimited' : number(value)
  }

  return (
    <label className="choice">
      <input className="choice__input" type="radio" name="plan" value={plan.code} checked={checked} onChange={onSelect} />
      <span className="cluster cluster--between">
        <span className="choice__title">{plan.name}</span>
        {plan.code === RECOMMENDED_PLAN_CODE && <Badge tone="solid-accent">Recommended</Badge>}
      </span>
      <span className="plan__price">
        {money(plan.priceCents, plan.currency, { decimals: plan.priceCents % 100 !== 0 })}
        <small className="text-sm text-muted"> /mo</small>
      </span>
      <ul className="plan__list" role="list">
        <li>{percent(plan.platformFeeBasisPoints / 100)} fee per sale</li>
        <li>{count('max_landing_pages')} landing pages</li>
        <li>{count('max_products')} products</li>
        <li>{count('max_email_sends_per_month')} emails / month</li>
        <li>{count('max_contacts')} contacts</li>
      </ul>
    </label>
  )
}

function PayoutAlert({ country, payoutMode }: { country: string; payoutMode: PayoutMode }) {
  return payoutMode === 'BankTransfer' ? (
    <Alert tone="info" icon={Landmark} title={`${country} · Bank transfer payouts`}>
      Your earnings are collected on Luma and paid to your bank account (IBAN) when you request a payout.
    </Alert>
  ) : (
    <Alert tone="info" icon={Landmark} title={`${country} · Stripe payouts`}>
      Your earnings go straight to your own Stripe account. Creators in Serbia or BiH are paid by bank transfer (IBAN)
      instead.
    </Alert>
  )
}
