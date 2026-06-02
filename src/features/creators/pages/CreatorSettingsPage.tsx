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
  const updateCreatorSettingsProfile = useCreatorStore((state) => state.updateCreatorSettingsProfile)
  const updateSettingsStatus = useCreatorStore((state) => state.updateSettingsStatus)
  const updateSettingsError = useCreatorStore((state) => state.updateSettingsError)
  const resetUpdateCreatorSettingsFeedback = useCreatorStore(
    (state) => state.resetUpdateCreatorSettingsFeedback,
  )
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>({ slug: '', values: {} })

  const isLoading = creatorSettingsStatus === 'loading' || creatorSettingsStatus === 'idle'
  const normalizedSlug = slug ?? ''
  const isSaving = updateSettingsStatus === 'submitting'
  const saveSuccess = updateSettingsStatus === 'success'

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

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-neutral-950 text-white">
              <span className="text-xs font-bold">CP</span>
            </span>
            <span className="text-sm text-neutral-400">/</span>
            <span className="text-sm font-medium text-neutral-950">{normalizedSlug}</span>
            <span className="text-sm text-neutral-400">/</span>
            <span className="text-sm font-medium text-neutral-950">settings</span>
          </div>

          <button
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
            type="button"
            onClick={() => navigate(`/app/${normalizedSlug}`)}
          >
            <ArrowLeft size={15} />
            Workspace
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10 lg:px-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            {creatorSettings?.creatorName ?? `/${normalizedSlug}`}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Creator settings</p>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex h-28 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 text-sm text-neutral-400 shadow-sm">
            <Loader2 className="animate-spin" size={17} />
            Loading settings
          </div>
        ) : null}

        {/* Error */}
        {creatorSettingsStatus === 'error' ? (
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-neutral-950">Could not load settings</p>
            <p className="mt-1 text-sm text-neutral-500">{creatorSettingsError}</p>
          </div>
        ) : null}

        {/* Settings content */}
        {creatorSettingsStatus === 'success' && creatorSettings ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Left — brand preview + form */}
            <div className="grid gap-5">
              {/* Brand preview */}
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div
                  className="relative min-h-40 p-6"
                  style={{ backgroundColor: normalizeColor(formValues.primaryColor) }}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative flex h-full flex-col justify-between gap-8">
                    <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      Preview
                    </span>
                    <div className="flex items-end gap-4">
                      <div className="grid size-16 shrink-0 place-items-center rounded-2xl border-4 border-white/60 bg-neutral-950 text-xl font-bold text-white shadow-lg">
                        {getInitials(formValues.brandName || creatorSettings.creatorName)}
                      </div>
                      <div>
                        <p className="text-2xl font-semibold text-white">
                          {formValues.brandName || creatorSettings.creatorName}
                        </p>
                        <p className="mt-1 text-sm text-white/70">/{creatorSettings.slug}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-neutral-100 border-t border-neutral-100">
                  <PreviewMeta label="Currency" value={creatorSettings.defaultCurrency} />
                  <PreviewMeta label="Timezone" value={formValues.timezone} />
                  <PreviewMeta label="Language" value={formatLanguage(formValues.language)} />
                </div>
              </div>

              {/* Edit form */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-neutral-950">Public details</p>
                    <p className="mt-0.5 text-sm text-neutral-500">Visible on your creator profile.</p>
                  </div>
                  {isDirty ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      Unsaved changes
                    </span>
                  ) : null}
                </div>

                <form
                  className="grid gap-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    void submitSettings()
                  }}
                >
                  <SettingsField
                    icon={Palette}
                    label="Brand name"
                    maxLength={creatorConstraints.brandName.maxLength}
                    value={formValues.brandName}
                    error={validation.fieldErrors.brandName}
                    onChange={(v) => updateField('brandName', v)}
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

                  <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                    <SettingsField
                      icon={Globe2}
                      label="Timezone"
                      maxLength={creatorConstraints.timezone.maxLength}
                      value={formValues.timezone}
                      error={validation.fieldErrors.timezone}
                      onChange={(v) => updateField('timezone', v)}
                    />

                    <label className="grid gap-2 text-sm font-medium text-neutral-700">
                      <span>Primary color</span>
                      <span className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3">
                        <input
                          className="size-6 cursor-pointer rounded-md border-0 bg-transparent p-0"
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
                        <span className="text-xs text-red-600">
                          {validation.fieldErrors.primaryColor}
                        </span>
                      ) : null}
                    </label>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                    <p className="text-sm font-medium text-neutral-700">Language</p>
                    <p className="mt-0.5 text-sm text-neutral-500">English (only available language)</p>
                  </div>

                  {updateSettingsError ? (
                    <p className="text-sm font-medium text-red-600">{updateSettingsError}</p>
                  ) : null}
                  {saveSuccess && !isDirty ? (
                    <p className="text-sm font-medium text-emerald-700">Settings saved.</p>
                  ) : null}

                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 sm:w-fit"
                    type="submit"
                    disabled={!validation.isValid || !isDirty || isSaving}
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save changes
                  </button>
                </form>
              </div>
            </div>

            {/* Right — workspace info */}
            <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Workspace info
              </p>
              <div className="mt-4 grid gap-3">
                <InfoRow icon={Fingerprint} label="Creator ID" value={creatorSettings.creatorPublicId} />
                <InfoRow icon={Hash} label="Slug" value={`/${creatorSettings.slug}`} />
                <InfoRow icon={CircleDollarSign} label="Currency" value={creatorSettings.defaultCurrency} />
                <InfoRow icon={Clock3} label="Timezone" value={formValues.timezone} />
              </div>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────── */

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  )
}

type SettingsFieldProps = {
  icon: typeof AtSign
  label: string
  onChange: (value: string) => void
  value: string
  error?: string
  maxLength?: number
  placeholder?: string
  type?: string
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
}: SettingsFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-neutral-700">
      <span className="flex items-center gap-1.5">
        <Icon size={14} className="text-neutral-400" />
        {label}
      </span>
      <input
        className={`h-11 rounded-xl border bg-white px-3 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 transition focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/8 ${
          error ? 'border-red-300 bg-red-50/30' : 'border-neutral-200'
        }`}
        maxLength={maxLength}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof AtSign; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-neutral-400 shadow-sm">
        <Icon size={14} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-neutral-400">{label}</span>
        <span className="mt-0.5 block break-all text-xs font-semibold text-neutral-950">{value}</span>
      </span>
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────── */

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
    fieldErrors.primaryColor = 'Must be a hex color like #111827.'
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

function areSettingsFormsEqual(a: UpdateCreatorSettingsRequest, b: UpdateCreatorSettingsRequest) {
  return (
    a.supportEmail.trim() === b.supportEmail.trim() &&
    a.brandName.trim() === b.brandName.trim() &&
    a.logoUrl.trim() === b.logoUrl.trim() &&
    a.primaryColor.trim() === b.primaryColor.trim() &&
    a.timezone.trim() === b.timezone.trim() &&
    a.language.trim().toLowerCase() === b.language.trim().toLowerCase()
  )
}
