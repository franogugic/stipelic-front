import {
  ArrowLeft,
  AtSign,
  CircleDollarSign,
  Clock3,
  Fingerprint,
  Globe2,
  Hash,
  Image,
  Loader2,
  Palette,
  Save,
  Settings,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { creatorConstraints } from '../model/creator-constraints'
import { useCreatorStore } from '../model/creator-store'
import type { CreatorSettings, UpdateCreatorSettingsRequest } from '../model/types'

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
  const navigate = useNavigate()
  const { slug } = useParams()
  const creatorSettings = useCreatorStore((state) => state.creatorSettings)
  const creatorSettingsStatus = useCreatorStore((state) => state.creatorSettingsStatus)
  const creatorSettingsError = useCreatorStore((state) => state.creatorSettingsError)
  const loadCreatorSettings = useCreatorStore((state) => state.loadCreatorSettings)
  const updateCreatorSettingsProfile = useCreatorStore(
    (state) => state.updateCreatorSettingsProfile,
  )
  const updateSettingsStatus = useCreatorStore((state) => state.updateSettingsStatus)
  const updateSettingsError = useCreatorStore((state) => state.updateSettingsError)
  const resetUpdateCreatorSettingsFeedback = useCreatorStore(
    (state) => state.resetUpdateCreatorSettingsFeedback,
  )
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>({
    slug: '',
    values: {},
  })

  const isLoading = creatorSettingsStatus === 'loading' || creatorSettingsStatus === 'idle'
  const normalizedSlug = slug ?? ''
  const isSaving = updateSettingsStatus === 'submitting'
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
    if (normalizedSlug) {
      void loadCreatorSettings(normalizedSlug)
    }
  }, [loadCreatorSettings, normalizedSlug])

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
    if (!normalizedSlug || !validation.isValid || !isDirty || isSaving) {
      return
    }

    const settings = await updateCreatorSettingsProfile(normalizedSlug, formValues)
    if (settings) {
      setSettingsDraft({ slug: normalizedSlug, values: {} })
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-neutral-950">
      <div className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl">
        <header className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-neutral-950">Creator Platform</p>
            <p className="mt-1 text-xs font-medium text-neutral-500">
              /{normalizedSlug}/settings
            </p>
          </div>

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
            type="button"
            onClick={() => navigate(`/app/${normalizedSlug}`)}
          >
            <ArrowLeft size={16} />
            Workspace
          </button>
        </header>
      </div>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-neutral-950 text-white">
              <Settings size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-500">Creator settings</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
                {creatorSettings?.creatorName ?? `/${normalizedSlug}`}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-500">
                Review the public settings stored for this creator workspace.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-8 flex items-center gap-3 rounded-3xl border border-neutral-200 bg-white p-5 text-sm font-medium text-neutral-500 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <Loader2 className="animate-spin" size={18} />
            Loading creator settings
          </div>
        ) : null}

        {creatorSettingsStatus === 'error' ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
            <p className="text-sm font-semibold">Could not load settings</p>
            <p className="mt-2 text-sm leading-6">{creatorSettingsError}</p>
          </div>
        ) : null}

        {creatorSettingsStatus === 'success' && creatorSettings ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="h-fit rounded-3xl border border-neutral-200 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <SettingsNavItem active icon={Palette} label="Brand" />
              <SettingsNavItem icon={Globe2} label="Public details" />
              <SettingsNavItem icon={Settings} label="Workspace" />
            </aside>

            <div className="grid gap-6">
              <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                <div
                  className="relative min-h-48 p-6"
                  style={{ backgroundColor: normalizeColor(formValues.primaryColor) }}
                >
                  <div className="absolute inset-0 bg-white/10" />
                  <div className="relative flex h-full flex-col justify-between gap-10">
                    <span className="inline-flex w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      Public preview
                    </span>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex items-end gap-4">
                        <div className="grid size-20 shrink-0 place-items-center rounded-3xl border-4 border-white/80 bg-neutral-950 text-2xl font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.20)]">
                          {getInitials(formValues.brandName || creatorSettings.creatorName)}
                        </div>
                        <div>
                          <p className="text-3xl font-semibold tracking-normal text-white">
                            {formValues.brandName || creatorSettings.creatorName}
                          </p>
                          <p className="mt-2 text-sm font-medium text-white/75">
                            /{creatorSettings.slug}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-950">
                        {formatLanguage(formValues.language)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid divide-y divide-neutral-200 p-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <PreviewMetric
                    label="Brand"
                    value={formValues.brandName || creatorSettings.creatorName}
                  />
                  <PreviewMetric
                    label="Currency"
                    value={creatorSettings.defaultCurrency}
                  />
                  <PreviewMetric label="Timezone" value={formValues.timezone} />
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold tracking-normal text-neutral-950">
                        Public details
                      </p>
                      <p className="mt-1 text-sm leading-6 text-neutral-500">
                        Values currently returned by the backend settings endpoint.
                      </p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
                      Editable
                    </span>
                  </div>

                  <form
                    className="mt-5 grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void submitSettings()
                    }}
                  >
                    <SettingsTextField
                      error={validation.fieldErrors.brandName}
                      icon={Palette}
                      label="Brand name"
                      maxLength={creatorConstraints.brandName.maxLength}
                      value={formValues.brandName}
                      onChange={(value) => updateField('brandName', value)}
                    />
                    <SettingsTextField
                      error={validation.fieldErrors.supportEmail}
                      icon={AtSign}
                      label="Support email"
                      maxLength={creatorConstraints.supportEmail.maxLength}
                      placeholder="hello@example.com"
                      type="email"
                      value={formValues.supportEmail}
                      onChange={(value) => updateField('supportEmail', value)}
                    />
                    <SettingsTextField
                      error={validation.fieldErrors.logoUrl}
                      icon={Image}
                      label="Logo URL"
                      maxLength={creatorConstraints.logoUrl.maxLength}
                      placeholder="https://example.com/logo.png"
                      type="url"
                      value={formValues.logoUrl}
                      onChange={(value) => updateField('logoUrl', value)}
                    />
                    <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                      <SettingsTextField
                        error={validation.fieldErrors.timezone}
                        icon={Globe2}
                        label="Timezone"
                        maxLength={creatorConstraints.timezone.maxLength}
                        value={formValues.timezone}
                        onChange={(value) => updateField('timezone', value)}
                      />
                      <label className="grid gap-2 text-sm font-medium text-neutral-900">
                        <span>Primary color</span>
                        <span className="flex h-12 items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3">
                          <input
                            className="size-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
                            type="color"
                            value={normalizeColor(formValues.primaryColor)}
                            onChange={(event) => updateField('primaryColor', event.target.value)}
                          />
                          <input
                            className="min-w-0 flex-1 text-[15px] text-neutral-950 outline-none"
                            maxLength={creatorConstraints.primaryColor.maxLength}
                            value={formValues.primaryColor}
                            onChange={(event) => updateField('primaryColor', event.target.value)}
                          />
                        </span>
                        {validation.fieldErrors.primaryColor ? (
                          <span className="text-xs font-medium text-red-600">
                            {validation.fieldErrors.primaryColor}
                          </span>
                        ) : null}
                      </label>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-sm font-semibold text-neutral-900">Language</p>
                      <p className="mt-2 text-sm leading-5 text-neutral-500">English</p>
                    </div>

                    {updateSettingsError ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {updateSettingsError}
                      </div>
                    ) : null}

                    {updateSettingsStatus === 'success' ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                        Creator settings updated.
                      </div>
                    ) : null}

                    <button
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 sm:w-fit"
                      type="submit"
                      disabled={!validation.isValid || !isDirty || isSaving}
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      Save changes
                    </button>
                  </form>
                </div>

                <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  <p className="text-lg font-semibold tracking-normal text-neutral-950">
                    Workspace
                  </p>
                  <div className="mt-5 grid gap-3">
                    <SettingsRow icon={Fingerprint} label="Creator ID" value={creatorSettings.creatorPublicId} />
                    <SettingsRow icon={Hash} label="Slug" value={`/${creatorSettings.slug}`} />
                    <SettingsRow icon={CircleDollarSign} label="Currency" value={creatorSettings.defaultCurrency} />
                    <SettingsRow icon={Clock3} label="Timezone" value={formValues.timezone} />
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}

type SettingsNavItemProps = {
  active?: boolean
  icon: typeof AtSign
  label: string
}

function SettingsNavItem({ active = false, icon: Icon, label }: SettingsNavItemProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold ${
        active ? 'bg-neutral-950 text-white' : 'text-neutral-600'
      }`}
    >
      <Icon size={17} />
      {label}
    </div>
  )
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 py-4">
      <p className="text-xs font-semibold uppercase text-neutral-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  )
}

type SettingsTextFieldProps = {
  icon: typeof AtSign
  label: string
  onChange: (value: string) => void
  value: string
  error?: string
  maxLength?: number
  placeholder?: string
  type?: string
}

function SettingsTextField({
  icon: Icon,
  label,
  onChange,
  value,
  error,
  maxLength,
  placeholder,
  type = 'text',
}: SettingsTextFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-900">
      <span className="flex items-center gap-2">
        <Icon size={16} />
        {label}
      </span>
      <input
        className={`h-12 rounded-xl border bg-white px-4 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/10 ${
          error ? 'border-red-300 bg-red-50/50' : 'border-neutral-200'
        }`}
        maxLength={maxLength}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  )
}

function SettingsRow({ icon: Icon, label, value }: { icon: typeof AtSign; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-neutral-500">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase text-neutral-400">{label}</span>
        <span className="mt-1 block break-words text-sm font-semibold text-neutral-950">
          {value}
        </span>
      </span>
    </div>
  )
}


function formatLanguage(language: string) {
  return language.toLowerCase() === 'en' ? 'English' : language
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'CP'
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
    fieldErrors.supportEmail = 'Enter a valid support email.'
  } else if (supportEmail.length > creatorConstraints.supportEmail.maxLength) {
    fieldErrors.supportEmail = `Support email can be up to ${creatorConstraints.supportEmail.maxLength} characters.`
  }

  if (brandName.length > creatorConstraints.brandName.maxLength) {
    fieldErrors.brandName = `Brand name can be up to ${creatorConstraints.brandName.maxLength} characters.`
  }

  if (logoUrl.length > creatorConstraints.logoUrl.maxLength) {
    fieldErrors.logoUrl = `Logo URL can be up to ${creatorConstraints.logoUrl.maxLength} characters.`
  } else if (logoUrl) {
    try {
      const parsedUrl = new URL(logoUrl)
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        fieldErrors.logoUrl = 'Logo URL must start with http or https.'
      }
    } catch {
      fieldErrors.logoUrl = 'Enter a valid logo URL.'
    }
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
    fieldErrors.primaryColor = 'Primary color must be a hex color, like #111827.'
  }

  if (timezone.length > creatorConstraints.timezone.maxLength) {
    fieldErrors.timezone = `Timezone can be up to ${creatorConstraints.timezone.maxLength} characters.`
  } else if (!timezonePattern.test(timezone)) {
    fieldErrors.timezone = 'Timezone is not valid.'
  }

  if (language !== 'en') {
    fieldErrors.language = 'English is the only language available right now.'
  }

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  }
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
  first: UpdateCreatorSettingsRequest,
  second: UpdateCreatorSettingsRequest,
) {
  return (
    first.supportEmail.trim() === second.supportEmail.trim() &&
    first.brandName.trim() === second.brandName.trim() &&
    first.logoUrl.trim() === second.logoUrl.trim() &&
    first.primaryColor.trim() === second.primaryColor.trim() &&
    first.timezone.trim() === second.timezone.trim() &&
    first.language.trim().toLowerCase() === second.language.trim().toLowerCase()
  )
}
