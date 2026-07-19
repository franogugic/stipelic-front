import { Loader2, Mail, Send, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { LandingPage } from '../../landing-pages/model/types'
import type { Product } from '../../products/model/types'
import type { CreatorSettings } from '../../creators/model/types'
import { useCampaignStore } from '../model/campaign-store'
import type { CampaignAudienceType, CampaignDetail } from '../model/types'

const BODY_MAX_LENGTH = 10_000
const SUBJECT_MAX_LENGTH = 200

const AUDIENCE_PREVIEW_DEBOUNCE_MS = 400

export function CampaignFormModal({
  slug,
  campaign,
  landingPages,
  products,
  creatorSettings,
  onClose,
}: {
  slug: string
  campaign?: CampaignDetail
  landingPages: LandingPage[]
  products: Product[]
  creatorSettings: CreatorSettings | null
  onClose: () => void
}) {
  const publishedLandingPages = useMemo(() => landingPages.filter((p) => p.status === 'Published'), [landingPages])
  const activeProducts = useMemo(() => products.filter((p) => p.status === 'Active'), [products])

  const [savedCampaign, setSavedCampaign] = useState<CampaignDetail | null>(campaign ?? null)
  const [subject, setSubject] = useState(campaign?.subject ?? '')
  const [bodyText, setBodyText] = useState(campaign?.bodyText ?? '')
  const [ctaLabel, setCtaLabel] = useState(campaign?.ctaLabel ?? '')
  const [ctaUrl, setCtaUrl] = useState(campaign?.ctaUrl ?? '')
  const [audienceType, setAudienceType] = useState<CampaignAudienceType>(campaign?.audienceType ?? 'LandingPage')
  const [targetPublicId, setTargetPublicId] = useState(
    campaign?.targetPublicId ?? publishedLandingPages[0]?.publicId ?? '',
  )
  const [isConfirmingSend, setIsConfirmingSend] = useState(false)

  const saveCampaign = useCampaignStore((s) => s.saveCampaign)
  const saveCampaignStatus = useCampaignStore((s) => s.saveCampaignStatus)
  const saveCampaignError = useCampaignStore((s) => s.saveCampaignError)
  const resetSaveCampaignFeedback = useCampaignStore((s) => s.resetSaveCampaignFeedback)

  const sendCampaignForSlug = useCampaignStore((s) => s.sendCampaignForSlug)
  const sendCampaignStatus = useCampaignStore((s) => s.sendCampaignStatus)
  const sendCampaignError = useCampaignStore((s) => s.sendCampaignError)
  const resetSendCampaignFeedback = useCampaignStore((s) => s.resetSendCampaignFeedback)

  const audiencePreview = useCampaignStore((s) => s.audiencePreview)
  const audiencePreviewStatus = useCampaignStore((s) => s.audiencePreviewStatus)
  const loadAudiencePreview = useCampaignStore((s) => s.loadAudiencePreview)
  const clearAudiencePreview = useCampaignStore((s) => s.clearAudiencePreview)

  const isDraft = !savedCampaign || savedCampaign.status === 'Draft'
  const isSaving = saveCampaignStatus === 'submitting'
  const isSending = sendCampaignStatus === 'submitting'

  const hasCta = ctaLabel.trim().length > 0 || ctaUrl.trim().length > 0
  const ctaValid = ctaLabel.trim().length === 0
    ? ctaUrl.trim().length === 0
    : ctaUrl.trim().length > 0
  const canSave =
    subject.trim().length > 0 &&
    subject.length <= SUBJECT_MAX_LENGTH &&
    bodyText.trim().length > 0 &&
    bodyText.length <= BODY_MAX_LENGTH &&
    ctaValid &&
    targetPublicId.length > 0 &&
    !isSaving

  // Debounced live audience preview — recomputed whenever the target changes.
  useEffect(() => {
    if (!targetPublicId) { clearAudiencePreview(); return }
    const handle = setTimeout(() => {
      void loadAudiencePreview(slug, audienceType, targetPublicId)
    }, AUDIENCE_PREVIEW_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [slug, audienceType, targetPublicId, loadAudiencePreview, clearAudiencePreview])

  const overLimit =
    audiencePreview !== null &&
    audiencePreview.monthlyLimit >= 0 &&
    audiencePreview.recipientCount > audiencePreview.remaining

  const handleSave = async () => {
    if (!canSave) return
    const result = await saveCampaign(slug, savedCampaign?.publicId ?? null, {
      subject: subject.trim(),
      bodyText,
      ctaLabel: hasCta ? ctaLabel.trim() : null,
      ctaUrl: hasCta ? ctaUrl.trim() : null,
      audienceType,
      targetPublicId,
    })
    if (result) setSavedCampaign(result)
  }

  const handleConfirmSend = async () => {
    if (!savedCampaign) return
    const result = await sendCampaignForSlug(slug, savedCampaign.publicId)
    if (result) {
      setSavedCampaign(result)
      setIsConfirmingSend(false)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 py-8 backdrop-blur-sm">
      <div className="grid max-h-[90vh] w-full max-w-4xl grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl light:border-neutral-200 light:bg-white">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 light:border-neutral-100">
          <h2 className="text-base font-semibold text-white light:text-neutral-950">
            {savedCampaign ? 'Edit campaign' : 'New campaign'}
          </h2>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white light:text-neutral-400 light:hover:bg-neutral-100 light:hover:text-neutral-700"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 overflow-y-auto lg:grid-cols-[1.2fr_1fr]">
          {/* Form */}
          <div className="grid gap-5 border-b border-white/10 p-6 lg:border-b-0 lg:border-r light:border-neutral-100">
            {!isDraft ? (
              <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200 light:bg-amber-50 light:text-amber-800">
                This campaign has already been queued and can no longer be edited.
              </p>
            ) : null}

            <ModalField label="Subject" required>
              <input
                type="text"
                maxLength={SUBJECT_MAX_LENGTH}
                disabled={!isDraft}
                value={subject}
                onChange={(e) => { resetSaveCampaignFeedback(); setSubject(e.target.value) }}
                placeholder="Big news for you…"
                className={inputClass}
              />
            </ModalField>

            <ModalField label="Body" required>
              <textarea
                rows={7}
                maxLength={BODY_MAX_LENGTH}
                disabled={!isDraft}
                value={bodyText}
                onChange={(e) => { resetSaveCampaignFeedback(); setBodyText(e.target.value) }}
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
                  disabled={!isDraft}
                  value={ctaLabel}
                  onChange={(e) => { resetSaveCampaignFeedback(); setCtaLabel(e.target.value) }}
                  placeholder="Shop now"
                  className={inputClass}
                />
              </ModalField>
              <ModalField label="CTA URL">
                <input
                  type="url"
                  maxLength={2000}
                  disabled={!isDraft}
                  value={ctaUrl}
                  onChange={(e) => { resetSaveCampaignFeedback(); setCtaUrl(e.target.value) }}
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

            <ModalField label="Audience">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-white/70 light:text-neutral-600">
                  <input
                    type="radio"
                    disabled={!isDraft}
                    checked={audienceType === 'LandingPage'}
                    onChange={() => {
                      setAudienceType('LandingPage')
                      setTargetPublicId(publishedLandingPages[0]?.publicId ?? '')
                    }}
                  />
                  Landing page
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 light:text-neutral-600">
                  <input
                    type="radio"
                    disabled={!isDraft}
                    checked={audienceType === 'Product'}
                    onChange={() => {
                      setAudienceType('Product')
                      setTargetPublicId(activeProducts[0]?.publicId ?? '')
                    }}
                  />
                  Product
                </label>
              </div>
              <select
                disabled={!isDraft}
                value={targetPublicId}
                onChange={(e) => setTargetPublicId(e.target.value)}
                className={`${inputClass} mt-2`}
              >
                {audienceType === 'LandingPage'
                  ? publishedLandingPages.map((p) => (
                      <option key={p.publicId} value={p.publicId}>{p.title}</option>
                    ))
                  : activeProducts.map((p) => (
                      <option key={p.publicId} value={p.publicId}>{p.name}</option>
                    ))}
              </select>
              {(audienceType === 'LandingPage' ? publishedLandingPages : activeProducts).length === 0 ? (
                <p className="text-xs text-white/40 light:text-neutral-400">
                  {audienceType === 'LandingPage'
                    ? 'No published landing pages yet.'
                    : 'No active products yet.'}
                </p>
              ) : null}
            </ModalField>

            <AudiencePreviewCard
              status={audiencePreviewStatus}
              preview={audiencePreview}
              overLimit={overLimit}
            />

            {saveCampaignError ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 light:bg-red-50 light:text-red-600">
                {saveCampaignError}
              </p>
            ) : null}

            {isDraft ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={!canSave}
                  onClick={() => void handleSave()}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 light:border-neutral-200 light:bg-white light:text-neutral-700 light:hover:bg-neutral-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={15} /> : null}
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={!savedCampaign || overLimit || isSending}
                  title={
                    !savedCampaign
                      ? 'Save this draft first'
                      : overLimit
                        ? 'This audience exceeds your remaining monthly sends'
                        : undefined
                  }
                  onClick={() => { resetSendCampaignFeedback(); setIsConfirmingSend(true) }}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40 light:text-neutral-950"
                >
                  <Send size={14} />
                  Send
                </button>
              </div>
            ) : null}
          </div>

          {/* Mail preview */}
          <div className="bg-white/[0.02] p-6 light:bg-neutral-50">
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
      </div>

      {isConfirmingSend ? (
        <SendConfirmDialog
          preview={audiencePreview}
          isSending={isSending}
          error={sendCampaignError}
          onCancel={() => setIsConfirmingSend(false)}
          onConfirm={() => void handleConfirmSend()}
        />
      ) : null}
    </div>
  )
}

function AudiencePreviewCard({
  status,
  preview,
  overLimit,
}: {
  status: 'idle' | 'loading' | 'success' | 'error'
  preview: { recipientCount: number; monthlyLimit: number; usedThisMonth: number; remaining: number } | null
  overLimit: boolean
}) {
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/40 light:border-neutral-200 light:bg-neutral-50 light:text-neutral-400">
        <Loader2 className="animate-spin" size={14} />
        Checking audience…
      </div>
    )
  }

  if (!preview) return null

  const remainingLabel = preview.monthlyLimit < 0 ? 'unlimited' : `${preview.remaining} of ${preview.monthlyLimit}`

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        overLimit
          ? 'border-red-500/30 bg-red-500/5 text-red-300 light:border-red-200 light:bg-red-50 light:text-red-700'
          : 'border-white/10 bg-white/[0.02] text-white/70 light:border-neutral-200 light:bg-neutral-50 light:text-neutral-600'
      }`}
    >
      This will send to <span className="font-semibold">{preview.recipientCount}</span> recipient
      {preview.recipientCount === 1 ? '' : 's'} · {remainingLabel} monthly sends remaining
      {overLimit ? ' — exceeds your remaining monthly sends.' : ''}
    </div>
  )
}

function SendConfirmDialog({
  preview,
  isSending,
  error,
  onCancel,
  onConfirm,
}: {
  preview: { recipientCount: number; remaining: number; monthlyLimit: number } | null
  isSending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl light:border-neutral-200 light:bg-white">
        <div className="grid size-11 place-items-center rounded-xl bg-accent/15">
          <Send className="text-accent-strong" size={20} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white light:text-neutral-950">Send this campaign?</h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-500">
          This will immediately email{' '}
          <span className="font-medium text-white/80 light:text-neutral-800">
            {preview?.recipientCount ?? 0} recipient{preview?.recipientCount === 1 ? '' : 's'}
          </span>
          . This cannot be undone.
        </p>
        {error ? <p className="mt-3 text-sm text-red-300 light:text-red-600">{error}</p> : null}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={isSending}
            onClick={onCancel}
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-700 light:hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={onConfirm}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-40 light:text-neutral-950"
          >
            {isSending ? <Loader2 className="animate-spin" size={15} /> : <Send size={14} />}
            Send now
          </button>
        </div>
      </div>
    </div>
  )
}

function MailPreview({
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
