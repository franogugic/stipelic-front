import {
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
import { useParams } from 'react-router-dom'
import { AppShell } from '../../../shared/ui/AppShell'
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
  const { slug } = useParams<{ slug: string }>()
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
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>({ slug: '', values: {} })

  const normalizedSlug = slug ?? ''
  const isLoading = creatorSettingsStatus === 'loading' || creatorSettingsStatus === 'idle'
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
