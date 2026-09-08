import { Archive, FileText, Loader2, Mail, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CreatorSettings } from '../../creators/model/types'
import { useTemplateStore } from '../model/template-store'
import type { EmailTemplate, EmailTemplateStarter } from '../model/types'

const BODY_MAX_LENGTH = 10_000
const SUBJECT_MAX_LENGTH = 200
const NAME_MAX_LENGTH = 100

export function TemplateEditorPanel({
  slug,
  template,
  creatorSettings,
  onClose,
}: {
  slug: string
  template?: EmailTemplate
  creatorSettings: CreatorSettings | null
  onClose: () => void
}) {
  const [savedTemplate, setSavedTemplate] = useState<EmailTemplate | null>(template ?? null)
  const [name, setName] = useState(template?.name ?? '')
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [bodyText, setBodyText] = useState(template?.bodyText ?? '')
  const [ctaLabel, setCtaLabel] = useState(template?.ctaLabel ?? '')
  const [ctaUrl, setCtaUrl] = useState(template?.ctaUrl ?? '')
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false)
  // Only reachable for brand-new templates — editing an existing one always skips straight to the form.
  const [pickerStep, setPickerStep] = useState<'choose' | 'form'>(template ? 'form' : 'choose')

  const saveTemplate = useTemplateStore((s) => s.saveTemplate)
  const saveTemplateStatus = useTemplateStore((s) => s.saveTemplateStatus)
  const saveTemplateError = useTemplateStore((s) => s.saveTemplateError)
  const resetSaveTemplateFeedback = useTemplateStore((s) => s.resetSaveTemplateFeedback)

  const archiveTemplateForSlug = useTemplateStore((s) => s.archiveTemplateForSlug)
  const archiveTemplateStatus = useTemplateStore((s) => s.archiveTemplateStatus)
  const archiveTemplateError = useTemplateStore((s) => s.archiveTemplateError)
  const resetArchiveTemplateFeedback = useTemplateStore((s) => s.resetArchiveTemplateFeedback)

  const starters = useTemplateStore((s) => s.starters)
  const startersStatus = useTemplateStore((s) => s.startersStatus)
  const loadStarters = useTemplateStore((s) => s.loadStarters)

  useEffect(() => {
    if (pickerStep === 'choose') void loadStarters(slug)
  }, [pickerStep, slug, loadStarters])

  const handlePickStarter = (starter: EmailTemplateStarter | null) => {
    if (starter) {
      setName(starter.name)
      setSubject(starter.subject)
      setBodyText(starter.bodyText)
      setCtaLabel(starter.ctaLabel ?? '')
      setCtaUrl(starter.ctaUrl ?? '')
    }
    setPickerStep('form')
  }

  const isActive = !savedTemplate || savedTemplate.status === 'Active'
  const isSaving = saveTemplateStatus === 'submitting'
  const isArchiving = archiveTemplateStatus === 'submitting'

  const hasCta = ctaLabel.trim().length > 0 || ctaUrl.trim().length > 0
  const ctaValid = ctaLabel.trim().length === 0
    ? ctaUrl.trim().length === 0
    : ctaUrl.trim().length > 0
  const canSave =
    name.trim().length > 0 &&
    name.length <= NAME_MAX_LENGTH &&
    subject.trim().length > 0 &&
    subject.length <= SUBJECT_MAX_LENGTH &&
    bodyText.trim().length > 0 &&
    bodyText.length <= BODY_MAX_LENGTH &&
    ctaValid &&
    !isSaving

  const handleSave = async () => {
    if (!canSave) return
    const result = await saveTemplate(slug, savedTemplate?.publicId ?? null, {
      name: name.trim(),
      subject: subject.trim(),
      bodyText,
      ctaLabel: hasCta ? ctaLabel.trim() : null,
      ctaUrl: hasCta ? ctaUrl.trim() : null,
    })
    if (result) setSavedTemplate(result)
  }

  const handleConfirmArchive = async () => {
    if (!savedTemplate) return
    const ok = await archiveTemplateForSlug(slug, savedTemplate.publicId)
    if (ok) { resetArchiveTemplateFeedback(); onClose() }
  }

  return (
    <div className="h-full rounded-xl border border-border bg-card p-5">
      {pickerStep === 'choose' ? (
        <div className="h-full overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.2rem' }}>
              New Template
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <p className="mb-4 text-sm text-white/50 light:text-neutral-500">
            Start from scratch, or pick a starter to pre-fill the subject and body — nothing is saved until you
            confirm.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handlePickStarter(null)}
              className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-left transition hover:border-white/25 hover:bg-white/[0.05] light:border-neutral-300 light:bg-white light:hover:border-neutral-400"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-white/60 light:bg-neutral-100 light:text-neutral-500">
                <FileText size={16} />
              </span>
              <span className="text-sm font-semibold text-white light:text-neutral-950">Start from scratch</span>
              <span className="text-xs text-white/40 light:text-neutral-400">Blank subject and body.</span>
            </button>

            {startersStatus === 'loading' ? (
              <div className="col-span-full flex h-32 items-center justify-center gap-2 text-sm text-white/40 light:text-neutral-400">
                <Loader2 className="animate-spin" size={16} />
                Loading starters…
              </div>
            ) : (
              starters.map((starter) => (
                <button
                  key={starter.key}
                  type="button"
                  onClick={() => handlePickStarter(starter)}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/20 hover:bg-white/[0.06] light:border-neutral-200 light:bg-white light:hover:border-neutral-300"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent light:bg-accent/10">
                    <Sparkles size={16} />
                  </span>
                  <span className="text-sm font-semibold text-white light:text-neutral-950">{starter.name}</span>
                  <span className="line-clamp-1 text-xs text-white/40 light:text-neutral-400">{starter.subject}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid h-full grid-cols-1 gap-6 overflow-y-auto lg:grid-cols-[1.2fr_1fr]">
          {/* Form */}
          <div className="grid gap-5">
            <h2 className="font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.2rem' }}>
              {savedTemplate ? 'Edit Template' : 'New Template'}
            </h2>

            {!isActive ? (
              <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200 light:bg-amber-50 light:text-amber-800">
                This template is archived and can no longer be edited or sent.
              </p>
            ) : null}

            <ModalField label="Name" required>
              <input
                type="text"
                maxLength={NAME_MAX_LENGTH}
                disabled={!isActive}
                value={name}
                onChange={(e) => { resetSaveTemplateFeedback(); setName(e.target.value) }}
                placeholder="Monthly newsletter"
                className={inputClass}
              />
            </ModalField>

            <ModalField label="Subject" required>
              <input
                type="text"
                maxLength={SUBJECT_MAX_LENGTH}
                disabled={!isActive}
                value={subject}
                onChange={(e) => { resetSaveTemplateFeedback(); setSubject(e.target.value) }}
                placeholder="Big news for you…"
                className={inputClass}
              />
            </ModalField>

            <ModalField label="Body" required>
              <textarea
                rows={7}
                maxLength={BODY_MAX_LENGTH}
                disabled={!isActive}
                value={bodyText}
                onChange={(e) => { resetSaveTemplateFeedback(); setBodyText(e.target.value) }}
                placeholder="Write your update…"
                className={`${inputClass} resize-none`}
              />
              <p className="text-right text-xs text-white/30 light:text-neutral-400">
                {bodyText.length} / {BODY_MAX_LENGTH}
              </p>
            </ModalField>

            <div className="grid grid-cols-2 gap-4">
              <ModalField label="CTA label">
                <input
                  type="text"
                  maxLength={100}
                  disabled={!isActive}
                  value={ctaLabel}
                  onChange={(e) => { resetSaveTemplateFeedback(); setCtaLabel(e.target.value) }}
                  placeholder="Shop now"
                  className={inputClass}
                />
              </ModalField>
              <ModalField label="CTA URL">
                <input
                  type="url"
                  maxLength={2000}
                  disabled={!isActive}
                  value={ctaUrl}
                  onChange={(e) => { resetSaveTemplateFeedback(); setCtaUrl(e.target.value) }}
                  placeholder="https://…"
                  className={inputClass}
                />
              </ModalField>
            </div>
            {!ctaValid ? (
              <p className="-mt-3 text-xs font-medium text-red-400 light:text-red-600">
                Set both a CTA label and URL, or leave both empty.
              </p>
            ) : null}

            {saveTemplateError ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 light:bg-red-50 light:text-red-600">
                {saveTemplateError}
              </p>
            ) : null}

            {archiveTemplateError ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 light:bg-red-50 light:text-red-600">
                {archiveTemplateError}
              </p>
            ) : null}

            {isActive ? (
              <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  disabled={!canSave}
                  onClick={() => void handleSave()}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40 light:text-neutral-950"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={15} /> : null}
                  {savedTemplate ? 'Save changes' : 'Create template'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  Discard
                </button>
                {savedTemplate ? (
                  <button
                    type="button"
                    disabled={isArchiving}
                    onClick={() => { resetArchiveTemplateFeedback(); setIsConfirmingArchive(true) }}
                    className="ml-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/70 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 light:border-neutral-200 light:bg-white light:text-neutral-600 light:hover:border-red-200 light:hover:bg-red-50 light:hover:text-red-600"
                  >
                    <Archive size={14} />
                    Archive
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Mail preview */}
          <div className="rounded-xl bg-white/[0.02] p-5 light:bg-neutral-50">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-400">
              Preview
            </p>
            <MailPreview
              subject={subject}
              bodyText={bodyText}
              ctaLabel={hasCta ? ctaLabel : null}
              ctaUrl={hasCta ? ctaUrl : null}
              brandName={creatorSettings?.brandName ?? creatorSettings?.creatorName ?? 'Your brand'}
              logoUrl={creatorSettings?.logoUrl ?? null}
              primaryColor={creatorSettings?.primaryColor ?? '#4C7CF0'}
            />
          </div>
        </div>
      )}

      {isConfirmingArchive ? (
        <ArchiveConfirmDialog
          isArchiving={isArchiving}
          error={archiveTemplateError}
          onCancel={() => setIsConfirmingArchive(false)}
          onConfirm={() => void handleConfirmArchive()}
        />
      ) : null}
    </div>
  )
}

function ArchiveConfirmDialog({
  isArchiving,
  error,
  onCancel,
  onConfirm,
}: {
  isArchiving: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl light:border-neutral-200 light:bg-white">
        <div className="grid size-11 place-items-center rounded-xl bg-amber-500/15 light:bg-amber-50">
          <Archive className="text-amber-400 light:text-amber-600" size={22} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white light:text-neutral-950">Archive this template?</h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-500">
          It will no longer be available to pick when sending — past sends made from it are unaffected.
        </p>
        {error ? <p className="mt-3 text-sm text-red-300 light:text-red-600">{error}</p> : null}
        <div className="mt-6 flex gap-3">
          <button type="button" disabled={isArchiving} className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-700 light:hover:bg-neutral-50" onClick={onCancel}>Cancel</button>
          <button type="button" disabled={isArchiving} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-40" onClick={onConfirm}>
            {isArchiving ? <Loader2 className="animate-spin" size={15} /> : null}
            Archive
          </button>
        </div>
      </div>
    </div>
  )
}

export function MailPreview({
  subject,
  bodyText,
  ctaLabel,
  ctaUrl,
  brandName,
  logoUrl,
  primaryColor,
}: {
  subject: string
  bodyText: string
  ctaLabel: string | null
  ctaUrl: string | null
  brandName: string
  logoUrl: string | null
  primaryColor: string
}) {
  const paragraphs = bodyText.split('\n').filter((line) => line.trim().length > 0)

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white light:border-neutral-200">
      <div className="max-h-[520px] overflow-y-auto p-6">
        {logoUrl ? (
          <img src={logoUrl} alt={brandName} className="mb-4 h-8 object-contain" />
        ) : (
          <p className="mb-4 text-lg font-bold text-neutral-950">{brandName}</p>
        )}

        <p className="mb-3 text-sm font-semibold text-neutral-500">{subject || 'Subject line…'}</p>

        {paragraphs.length > 0 ? (
          paragraphs.map((line, i) => (
            <p key={i} className="mb-4 text-sm leading-relaxed text-neutral-800">{line}</p>
          ))
        ) : (
          <p className="mb-4 text-sm italic leading-relaxed text-neutral-300">Your message body will appear here…</p>
        )}

        {ctaLabel && ctaUrl ? (
          <span
            className="mb-4 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {ctaLabel}
          </span>
        ) : null}

        <div className="mt-6 border-t border-neutral-100 pt-4">
          <p className="text-xs text-neutral-400">Sent via Creator Platform</p>
          <p className="text-xs text-neutral-400">
            <span className="underline">Unsubscribe</span> from these emails.
          </p>
        </div>
      </div>
    </div>
  )
}

function ModalField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-white/80 light:text-neutral-700">
        <Mail size={13} className="text-white/30 light:text-neutral-400" />
        {label}{required ? <span className="ml-0.5 text-red-400 light:text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50 light:border-neutral-200 light:bg-white light:text-neutral-950 light:placeholder-neutral-400 light:focus:border-neutral-400 light:focus:ring-neutral-100'
