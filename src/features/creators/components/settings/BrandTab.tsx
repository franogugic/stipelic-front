import { Check, CircleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useImageUpload } from '../../../../shared/lib/use-image-upload'
import { isHexColor } from '../../../../shared/lib/brand-color'
import {
  Alert,
  Button,
  Card,
  ColorField,
  Field,
  Input,
  Select,
  Swatches,
  Uploader,
  useToast,
} from '../../../../shared/ui/ledger'
import { creatorConstraints } from '../../model/creator-constraints'
import { useCreatorStore } from '../../model/creator-store'
import type { CreatorSettings, UpdateCreatorSettingsRequest } from '../../model/types'
import { BrandPreview } from './BrandPreview'

const BRAND_SUGGESTIONS = [
  { value: '#E2553A', label: 'Terracotta' },
  { value: '#1F8FA8', label: 'Adriatic' },
  { value: '#6B7A2A', label: 'Olive' },
  { value: '#8E4F9E', label: 'Plum' },
  { value: '#1C1612', label: 'Ink' },
  { value: '#F2C230', label: 'Sunflower' },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIMEZONE_PATTERN = /^[A-Za-z0-9_./+-]+$/

type Errors = Partial<Record<keyof UpdateCreatorSettingsRequest, string>>

function toForm(settings: CreatorSettings): UpdateCreatorSettingsRequest {
  return {
    supportEmail: settings.supportEmail,
    brandName: settings.brandName,
    logoUrl: settings.logoUrl,
    primaryColor: settings.primaryColor,
    timezone: settings.timezone,
    language: settings.language || 'en',
  }
}

function sameForm(a: UpdateCreatorSettingsRequest, b: UpdateCreatorSettingsRequest) {
  return (
    a.supportEmail.trim() === b.supportEmail.trim() &&
    a.brandName.trim() === b.brandName.trim() &&
    a.logoUrl.trim() === b.logoUrl.trim() &&
    a.primaryColor.trim().toLowerCase() === b.primaryColor.trim().toLowerCase() &&
    a.timezone.trim() === b.timezone.trim() &&
    a.language.trim().toLowerCase() === b.language.trim().toLowerCase()
  )
}

function validate(values: UpdateCreatorSettingsRequest): Errors {
  const errors: Errors = {}
  const supportEmail = values.supportEmail.trim()
  const brandName = values.brandName.trim()
  const timezone = values.timezone.trim()

  if (supportEmail && !EMAIL_PATTERN.test(supportEmail)) errors.supportEmail = 'Enter a valid email address.'
  else if (supportEmail.length > creatorConstraints.supportEmail.maxLength) {
    errors.supportEmail = `Max ${creatorConstraints.supportEmail.maxLength} characters.`
  }
  if (brandName.length > creatorConstraints.brandName.maxLength) {
    errors.brandName = `Max ${creatorConstraints.brandName.maxLength} characters.`
  }
  if (!isHexColor(values.primaryColor.trim())) errors.primaryColor = 'Must be a hex colour like #E2553A.'
  if (timezone.length > creatorConstraints.timezone.maxLength) {
    errors.timezone = `Max ${creatorConstraints.timezone.maxLength} characters.`
  } else if (!TIMEZONE_PATTERN.test(timezone)) {
    errors.timezone = 'Invalid timezone format.'
  }
  if (values.language.trim().toLowerCase() !== 'en') errors.language = 'English is the only supported language.'
  return errors
}

function timezones(current: string) {
  const supported =
    typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
  const all = new Set<string>(['UTC', ...supported])
  if (current) all.add(current)
  return [...all].sort((a, b) => a.localeCompare(b))
}

function fileNameOf(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '')
  } catch {
    return ''
  }
}

/** Settings → Brand: the form on the left, a live preview on the right. */
export function BrandTab({ slug, settings, currency }: { slug: string; settings: CreatorSettings; currency: string }) {
  const toast = useToast()
  const saveSettings = useCreatorStore((s) => s.updateCreatorSettingsProfile)
  const resetFeedback = useCreatorStore((s) => s.resetUpdateCreatorSettingsFeedback)

  const saved = useMemo(() => toForm(settings), [settings])
  const [form, setForm] = useState(saved)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const upload = useImageUpload({
    slug,
    purpose: 'CreatorLogo',
    onUploaded: (url) => setForm((current) => ({ ...current, logoUrl: url })),
  })

  const errors = validate(form)
  const dirty = !sameForm(form, saved)
  const timezoneOptions = useMemo(() => timezones(form.timezone), [form.timezone])
  const set = <K extends keyof UpdateCreatorSettingsRequest>(key: K, value: UpdateCreatorSettingsRequest[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (saving || !dirty || Object.keys(errors).length > 0) return
    setSaving(true)
    setRequestError(null)
    resetFeedback()
    const result = await saveSettings(slug, form)
    setSaving(false)
    if (result) {
      setForm(toForm(result))
      setSubmitted(false)
      toast({ tone: 'success', title: 'Brand saved', message: 'Your pages and emails use it right away.' })
    } else {
      setRequestError(useCreatorStore.getState().updateSettingsError ?? 'We couldn’t save the brand. Please try again.')
    }
  }

  const previewColor = isHexColor(form.primaryColor.trim()) ? form.primaryColor.trim() : saved.primaryColor
  const previewName = form.brandName.trim() || settings.creatorName

  return (
    <div className="settings-grid settings-grid--brand">
      <Card title="Brand">
        <form className="form" noValidate onSubmit={(event) => void save(event)}>
          {requestError && (
            <Alert tone="danger" icon={CircleAlert} live>
              {requestError}
            </Alert>
          )}
          <Field
            label="Brand name"
            hint="Shown on your pages and as the sender of your emails."
            error={submitted ? errors.brandName : undefined}
          >
            {(control) => (
              <Input {...control} value={form.brandName} onChange={(event) => set('brandName', event.target.value)} />
            )}
          </Field>
          <Field
            label="Support email"
            hint="Reply-to address for your campaigns, and shown to buyers after they pay."
            error={submitted ? errors.supportEmail : undefined}
          >
            {(control) => (
              <Input
                {...control}
                type="email"
                inputMode="email"
                value={form.supportEmail}
                onChange={(event) => set('supportEmail', event.target.value)}
              />
            )}
          </Field>
          <fieldset className="form-group">
            <legend className="field__label">Logo</legend>
            <Uploader
              label="Logo"
              hint="PNG, JPG or WebP · square works best · up to 5 MB"
              value={form.logoUrl || null}
              fileName={upload.fileName ?? fileNameOf(form.logoUrl)}
              uploading={upload.uploading}
              progress={upload.progress}
              error={upload.error}
              onSelect={(file) => void upload.upload(file)}
              onRemove={() => {
                set('logoUrl', '')
                upload.clearError()
              }}
            />
            <p className="field__hint">Used in your page navbar and emails. Without a logo, your brand name is shown.</p>
          </fieldset>
          <fieldset className="form-group">
            <legend className="field__label">Primary colour</legend>
            <ColorField
              value={form.primaryColor}
              aria-label="Primary colour hex value"
              onChange={(value) => set('primaryColor', value)}
            />
            <Swatches
              label="Suggested colours"
              options={BRAND_SUGGESTIONS}
              value={form.primaryColor}
              onChange={(value) => set('primaryColor', value)}
            />
            {submitted && errors.primaryColor ? (
              <p className="field__error">
                <CircleAlert />
                <span>{errors.primaryColor}</span>
              </p>
            ) : (
              <p className="field__hint">
                Used for buttons and highlights on your pages and emails. Text in this colour is shaded automatically so
                it stays readable.
              </p>
            )}
          </fieldset>
          <div className="form-row">
            <Field label="Timezone" error={submitted ? errors.timezone : undefined}>
              {(control) => (
                <Select {...control} value={form.timezone} onChange={(event) => set('timezone', event.target.value)}>
                  {timezoneOptions.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Language" hint="For buttons and messages on your public pages." error={submitted ? errors.language : undefined}>
              {(control) => (
                <Select {...control} value={form.language} onChange={(event) => set('language', event.target.value)}>
                  <option value="en">English</option>
                </Select>
              )}
            </Field>
          </div>
          <div className="cluster cluster--end">
            <Button
              variant="primary"
              icon={Check}
              type="submit"
              loading={saving}
              disabledReason={dirty ? undefined : 'No changes to save.'}
            >
              Save brand
            </Button>
          </div>
        </form>
      </Card>
      <BrandPreview brandName={previewName} supportEmail={form.supportEmail.trim() || settings.supportEmail} color={previewColor} currency={currency} />
    </div>
  )
}
