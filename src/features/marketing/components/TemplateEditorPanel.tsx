import { Archive, FileText, Loader2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FieldInput, GhostBtn, Modal, PrimaryBtn, TextArea } from '../../../shared/ui/figma'
import type { CreatorSettings } from '../../creators/model/types'
import {
  BODY_MAX_LENGTH,
  CTA_LABEL_MAX_LENGTH,
  CTA_URL_MAX_LENGTH,
  SUBJECT_MAX_LENGTH,
} from '../model/mail-content-rules'
import { useTemplateStore } from '../model/template-store'
import type { EmailTemplate, EmailTemplateStarter } from '../model/types'

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
    <div className="h-full rounded-lg border border-border p-5 overflow-y-auto">
      {pickerStep === 'choose' ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.2rem' }}>
              New Template
            </h2>
            <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Start from scratch, or pick a starter to pre-fill the subject and body — nothing is saved until you
            confirm.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handlePickStarter(null)}
              className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border bg-secondary p-4 text-left transition-colors hover:border-chart-1/60"
            >
              <FileText size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold">Start from scratch</span>
              <span className="text-[11px] text-muted-foreground">Blank subject and body.</span>
            </button>

            {startersStatus === 'loading' ? (
              <div className="col-span-full flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="animate-spin" size={16} />
                Loading starters…
              </div>
            ) : (
              starters.map((starter) => (
                <button
                  key={starter.key}
                  type="button"
                  onClick={() => handlePickStarter(starter)}
                  className="flex flex-col items-start gap-2 rounded-lg border border-border bg-secondary p-4 text-left transition-colors hover:border-chart-1/60"
                >
                  <Sparkles size={16} style={{ color: 'var(--color-chart-1)' }} />
                  <span className="text-sm font-semibold">{starter.name}</span>
                  <span className="line-clamp-1 text-[11px] text-muted-foreground">{starter.subject}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Form */}
          <div className="space-y-3">
            <h2 className="font-bold" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.2rem' }}>
              {savedTemplate ? 'Edit Template' : 'New Template'}
            </h2>

            {!isActive && (
              <p className="text-xs" style={{ color: 'var(--color-chart-5)' }}>
                This template is archived and can no longer be edited or sent.
              </p>
            )}

            <FieldInput
              label="Name"
              value={name}
              onChange={(value) => { resetSaveTemplateFeedback(); setName(value) }}
              placeholder="Monthly newsletter"
              maxLength={NAME_MAX_LENGTH}
              disabled={!isActive}
            />

            <FieldInput
              label="Subject"
              value={subject}
              onChange={(value) => { resetSaveTemplateFeedback(); setSubject(value) }}
              placeholder="Big news for you…"
              maxLength={SUBJECT_MAX_LENGTH}
              disabled={!isActive}
            />

            <div>
              <TextArea
                label="Body"
                rows={7}
                value={bodyText}
                onChange={(value) => { resetSaveTemplateFeedback(); setBodyText(value) }}
                placeholder="Write your update…"
                maxLength={BODY_MAX_LENGTH}
                disabled={!isActive}
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {bodyText.length} / {BODY_MAX_LENGTH}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldInput
                label="CTA label"
                value={ctaLabel}
                onChange={(value) => { resetSaveTemplateFeedback(); setCtaLabel(value) }}
                placeholder="Shop now"
                maxLength={CTA_LABEL_MAX_LENGTH}
                disabled={!isActive}
              />
              <FieldInput
                label="CTA URL"
                type="url"
                value={ctaUrl}
                onChange={(value) => { resetSaveTemplateFeedback(); setCtaUrl(value) }}
                placeholder="https://…"
                maxLength={CTA_URL_MAX_LENGTH}
                disabled={!isActive}
                error={!ctaValid ? 'Set both a CTA label and URL, or leave both empty.' : undefined}
              />
            </div>

            {saveTemplateError && (
              <p className="text-xs" style={{ color: 'var(--color-chart-4)' }}>{saveTemplateError}</p>
            )}
            {archiveTemplateError && (
              <p className="text-xs" style={{ color: 'var(--color-chart-4)' }}>{archiveTemplateError}</p>
            )}

            <div className="flex gap-2 pt-4 border-t border-border">
              {isActive ? (
                <>
                  <PrimaryBtn loading={isSaving} disabled={!canSave} onClick={() => void handleSave()}>
                    {savedTemplate ? 'Save changes' : 'Create template'}
                  </PrimaryBtn>
                  <GhostBtn onClick={onClose}>Discard</GhostBtn>
                  {savedTemplate && (
                    <GhostBtn
                      className="ml-auto"
                      icon={<Archive size={12} />}
                      disabled={isArchiving}
                      onClick={() => { resetArchiveTemplateFeedback(); setIsConfirmingArchive(true) }}
                    >
                      Archive
                    </GhostBtn>
                  )}
                </>
              ) : (
                <GhostBtn onClick={onClose}>Close</GhostBtn>
              )}
            </div>
          </div>

          {/* Mail preview */}
          <div className="rounded-lg bg-secondary p-5">
            <p className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">Preview</p>
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

      <Modal
        open={isConfirmingArchive}
        title="Archive this template?"
        onClose={() => setIsConfirmingArchive(false)}
        dismissable={!isArchiving}
      >
        <p className="text-sm text-muted-foreground mb-5">
          It will no longer be available to pick when sending — past sends made from it are unaffected.
        </p>
        {archiveTemplateError && (
          <p className="text-xs mb-3" style={{ color: 'var(--color-chart-4)' }}>{archiveTemplateError}</p>
        )}
        <div className="flex gap-2">
          <PrimaryBtn className="flex-1 justify-center" loading={isArchiving} onClick={() => void handleConfirmArchive()}>
            Archive
          </PrimaryBtn>
          <GhostBtn className="px-5" disabled={isArchiving} onClick={() => setIsConfirmingArchive(false)}>
            Cancel
          </GhostBtn>
        </div>
      </Modal>
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
    <div className="overflow-hidden rounded-xl border border-border bg-white">
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
