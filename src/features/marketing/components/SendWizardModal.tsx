import { CheckCircle2, ChevronLeft, Loader2, Send, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { LandingPage } from '../../landing-pages/model/types'
import type { Product } from '../../products/model/types'
import type { CreatorSettings } from '../../creators/model/types'
import { useCampaignStore } from '../model/campaign-store'
import type { CampaignAudienceType, EmailTemplate } from '../model/types'
import { MailPreview } from './TemplateEditorPanel'

const AUDIENCE_PREVIEW_DEBOUNCE_MS = 400
const MIN_SCHEDULE_BUFFER_MINUTES = 2
const SCHEDULE_TOO_SOON_MESSAGE = `Scheduled time must be at least ${MIN_SCHEDULE_BUFFER_MINUTES} minutes from now.`

/** Converts a `datetime-local` input value (no timezone) to an ISO string in the user's local timezone. */
function localInputToIso(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function SendWizardModal({
  slug,
  templates,
  landingPages,
  products,
  creatorSettings,
  onClose,
  onSent,
}: {
  slug: string
  templates: EmailTemplate[]
  landingPages: LandingPage[]
  products: Product[]
  creatorSettings: CreatorSettings | null
  onClose: () => void
  onSent: () => void
}) {
  const activeTemplates = useMemo(() => templates.filter((t) => t.status === 'Active'), [templates])
  const publishedLandingPages = useMemo(() => landingPages.filter((p) => p.status === 'Published'), [landingPages])
  const activeProducts = useMemo(() => products.filter((p) => p.status === 'Active'), [products])

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(activeTemplates[0]?.publicId ?? null)
  const [audienceType, setAudienceType] = useState<CampaignAudienceType>('LandingPage')
  const [targetPublicId, setTargetPublicId] = useState(publishedLandingPages[0]?.publicId ?? '')
  const [isConfirming, setIsConfirming] = useState(false)
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now')
  const [scheduledAtLocal, setScheduledAtLocal] = useState('')

  const selectedTemplate = activeTemplates.find((t) => t.publicId === selectedTemplateId) ?? null

  const [isRecipientsOpen, setIsRecipientsOpen] = useState(false)

  const audiencePreview = useCampaignStore((s) => s.audiencePreview)
  const audiencePreviewStatus = useCampaignStore((s) => s.audiencePreviewStatus)
  const loadAudiencePreview = useCampaignStore((s) => s.loadAudiencePreview)
  const clearAudiencePreview = useCampaignStore((s) => s.clearAudiencePreview)

  const audienceRecipients = useCampaignStore((s) => s.audienceRecipients)
  const audienceRecipientsStatus = useCampaignStore((s) => s.audienceRecipientsStatus)
  const audienceRecipientsHasMore = useCampaignStore((s) => s.audienceRecipientsHasMore)
  const audienceRecipientsLoadMoreStatus = useCampaignStore((s) => s.audienceRecipientsLoadMoreStatus)
  const loadAudienceRecipients = useCampaignStore((s) => s.loadAudienceRecipients)
  const loadMoreAudienceRecipients = useCampaignStore((s) => s.loadMoreAudienceRecipients)
  const clearAudienceRecipients = useCampaignStore((s) => s.clearAudienceRecipients)

  const sendCampaignForSlug = useCampaignStore((s) => s.sendCampaignForSlug)
  const sendCampaignStatus = useCampaignStore((s) => s.sendCampaignStatus)
  const sendCampaignError = useCampaignStore((s) => s.sendCampaignError)
  const resetSendCampaignFeedback = useCampaignStore((s) => s.resetSendCampaignFeedback)

  const isSending = sendCampaignStatus === 'submitting'

  useEffect(() => {
    clearAudienceRecipients()
    if (step !== 2 || !targetPublicId) { clearAudiencePreview(); return }
    const handle = setTimeout(() => {
      void loadAudiencePreview(slug, audienceType, targetPublicId)
    }, AUDIENCE_PREVIEW_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [step, slug, audienceType, targetPublicId, loadAudiencePreview, clearAudiencePreview, clearAudienceRecipients])

  const overLimit =
    audiencePreview !== null &&
    audiencePreview.monthlyLimit >= 0 &&
    audiencePreview.recipientCount > audiencePreview.remaining

  const scheduledAtIso = sendMode === 'schedule' ? localInputToIso(scheduledAtLocal) : null
  const [scheduleWarning, setScheduleWarning] = useState<string | null>(null)

  const isScheduleValid = (iso: string) =>
    new Date(iso).getTime() >= Date.now() + MIN_SCHEDULE_BUFFER_MINUTES * 60_000

  const handleScheduledAtChange = (value: string) => {
    setScheduledAtLocal(value)
    const iso = localInputToIso(value)
    setScheduleWarning(iso && !isScheduleValid(iso) ? SCHEDULE_TOO_SOON_MESSAGE : null)
  }

  const isScheduleMissing = sendMode === 'schedule' && !scheduledAtLocal
  const canProceedToConfirm = sendMode === 'now' || (!isScheduleMissing && !scheduleWarning)

  const handleReviewClick = () => {
    if (sendMode === 'schedule' && scheduledAtIso && !isScheduleValid(scheduledAtIso)) {
      setScheduleWarning(SCHEDULE_TOO_SOON_MESSAGE)
      return
    }
    resetSendCampaignFeedback()
    setIsConfirming(true)
  }

  const handleConfirmSend = async () => {
    if (!selectedTemplate) return
    if (sendMode === 'schedule' && (!scheduledAtIso || !isScheduleValid(scheduledAtIso))) return

    const result = await sendCampaignForSlug(slug, {
      templatePublicId: selectedTemplate.publicId,
      audienceType,
      targetPublicId,
      ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
    })
    if (result) {
      setIsConfirming(false)
      onSent()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 py-8 backdrop-blur-sm">
      <div className="grid max-h-[90vh] w-full max-w-4xl grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl light:border-neutral-200 light:bg-white">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 light:border-neutral-100">
          <div className="flex items-center gap-3">
            {step === 2 ? (
              <button
                type="button"
                className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white light:text-neutral-400 light:hover:bg-neutral-100 light:hover:text-neutral-700"
                onClick={() => { setStep(1); setIsRecipientsOpen(false) }}
              >
                <ChevronLeft size={16} />
              </button>
            ) : null}
            <h2 className="text-base font-semibold text-white light:text-neutral-950">
              {step === 1 ? 'Send email · Step 1: pick a template' : 'Send email · Step 2: pick an audience'}
            </h2>
          </div>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white light:text-neutral-400 light:hover:bg-neutral-100 light:hover:text-neutral-700"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 overflow-y-auto lg:grid-cols-[1.2fr_1fr]">
            <div className="grid gap-2 overflow-y-auto border-b border-white/10 p-6 lg:border-b-0 lg:border-r light:border-neutral-100">
              {activeTemplates.length === 0 ? (
                <p className="text-sm text-white/40 light:text-neutral-400">
                  No active templates. Create one in the Templates tab first.
                </p>
              ) : (
                activeTemplates.map((t) => (
                  <button
                    key={t.publicId}
                    type="button"
                    onClick={() => setSelectedTemplateId(t.publicId)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      selectedTemplateId === t.publicId
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] light:border-neutral-200 light:bg-white light:hover:bg-neutral-50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-white light:text-neutral-950">{t.name}</p>
                    <p className="mt-0.5 truncate text-xs text-white/50 light:text-neutral-500">{t.subject}</p>
                  </button>
                ))
              )}
            </div>
            <div className="bg-white/[0.02] p-6 light:bg-neutral-50">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30 light:text-neutral-400">
                Preview
              </p>
              {selectedTemplate ? (
                <MailPreview
                  subject={selectedTemplate.subject}
                  bodyText={selectedTemplate.bodyText}
                  ctaLabel={selectedTemplate.ctaLabel}
                  ctaUrl={selectedTemplate.ctaUrl}
                  brandName={creatorSettings?.brandName ?? creatorSettings?.creatorName ?? 'Your brand'}
                  logoUrl={creatorSettings?.logoUrl ?? null}
                  primaryColor={creatorSettings?.primaryColor ?? '#4C7CF0'}
                />
              ) : (
                <p className="text-sm text-white/40 light:text-neutral-400">Pick a template to preview it.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 overflow-y-auto p-6">
            <div className="grid gap-1.5">
              <p className="text-sm font-medium text-white/80 light:text-neutral-700">Audience</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-white/70 light:text-neutral-600">
                  <input
                    type="radio"
                    checked={audienceType === 'LandingPage'}
                    onChange={() => {
                      setAudienceType('LandingPage')
                      setTargetPublicId(publishedLandingPages[0]?.publicId ?? '')
                      setIsRecipientsOpen(false)
                    }}
                  />
                  Landing page
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 light:text-neutral-600">
                  <input
                    type="radio"
                    checked={audienceType === 'Product'}
                    onChange={() => {
                      setAudienceType('Product')
                      setTargetPublicId(activeProducts[0]?.publicId ?? '')
                      setIsRecipientsOpen(false)
                    }}
                  />
                  Product
                </label>
              </div>
              <select
                value={targetPublicId}
                onChange={(e) => { setTargetPublicId(e.target.value); setIsRecipientsOpen(false) }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:border-neutral-200 light:bg-white light:text-neutral-950"
              >
                {(audienceType === 'LandingPage' ? publishedLandingPages : activeProducts).map((p) => (
                  <option key={p.publicId} value={p.publicId}>
                    {'title' in p ? p.title : p.name}
                  </option>
                ))}
              </select>
              {(audienceType === 'LandingPage' ? publishedLandingPages : activeProducts).length === 0 ? (
                <p className="text-xs text-white/40 light:text-neutral-400">
                  {audienceType === 'LandingPage'
                    ? 'No published landing pages yet.'
                    : 'No active products yet.'}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <p className="text-sm font-medium text-white/80 light:text-neutral-700">When to send</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-white/70 light:text-neutral-600">
                  <input
                    type="radio"
                    checked={sendMode === 'now'}
                    onChange={() => setSendMode('now')}
                  />
                  Send now
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 light:text-neutral-600">
                  <input
                    type="radio"
                    checked={sendMode === 'schedule'}
                    onChange={() => setSendMode('schedule')}
                  />
                  Schedule for later
                </label>
              </div>
              {sendMode === 'schedule' ? (
                <div className="mt-2">
                  <input
                    type="datetime-local"
                    value={scheduledAtLocal}
                    onChange={(e) => handleScheduledAtChange(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:border-neutral-200 light:bg-white light:text-neutral-950"
                  />
                  {scheduleWarning ? (
                    <p className="mt-1.5 text-xs text-red-400 light:text-red-600">{scheduleWarning}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <AudiencePreviewCard
              status={audiencePreviewStatus}
              preview={audiencePreview}
              overLimit={overLimit}
              estimatedOnly={sendMode === 'schedule'}
              onToggleRecipients={() => {
                const next = !isRecipientsOpen
                setIsRecipientsOpen(next)
                if (next && audienceRecipientsStatus === 'idle') {
                  void loadAudienceRecipients(slug, audienceType, targetPublicId)
                }
              }}
              isRecipientsOpen={isRecipientsOpen}
            />

            {isRecipientsOpen ? (
              <RecipientsListPanel
                status={audienceRecipientsStatus}
                emails={audienceRecipients}
                hasMore={audienceRecipientsHasMore}
                loadMoreStatus={audienceRecipientsLoadMoreStatus}
                onLoadMore={() => void loadMoreAudienceRecipients(slug, audienceType, targetPublicId)}
              />
            ) : null}

            {sendCampaignError ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 light:bg-red-50 light:text-red-600">
                {sendCampaignError}
              </p>
            ) : null}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4 light:border-neutral-100">
          {step === 1 ? (
            <button
              type="button"
              disabled={!selectedTemplate}
              onClick={() => setStep(2)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40 light:text-neutral-950"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={!targetPublicId || overLimit || isSending || !canProceedToConfirm}
              title={overLimit ? 'This audience exceeds your remaining monthly sends' : undefined}
              onClick={handleReviewClick}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40 light:text-neutral-950"
            >
              <Send size={14} />
              {sendMode === 'schedule' ? 'Review and schedule' : 'Review and send'}
            </button>
          )}
        </div>
      </div>

      {isConfirming ? (
        <SendConfirmDialog
          preview={audiencePreview}
          isSending={isSending}
          error={sendCampaignError}
          scheduledAtIso={scheduledAtIso}
          onCancel={() => setIsConfirming(false)}
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
  estimatedOnly,
  onToggleRecipients,
  isRecipientsOpen,
}: {
  status: 'idle' | 'loading' | 'success' | 'error'
  preview: { recipientCount: number; monthlyLimit: number; usedThisMonth: number; remaining: number } | null
  overLimit: boolean
  estimatedOnly: boolean
  onToggleRecipients: () => void
  isRecipientsOpen: boolean
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
      This will send to{' '}
      <button
        type="button"
        onClick={onToggleRecipients}
        aria-expanded={isRecipientsOpen}
        className="font-semibold text-inherit underline decoration-current/40 underline-offset-2 transition hover:decoration-current"
      >
        {preview.recipientCount}
      </button>{' '}
      recipient
      {preview.recipientCount === 1 ? '' : 's'} · {remainingLabel} monthly sends remaining
      {overLimit ? ' — exceeds your remaining monthly sends.' : ''}
      {estimatedOnly ? (
        <p className="mt-1 text-xs text-white/40 light:text-neutral-400">
          Estimated — actual audience is resolved again at send time.
        </p>
      ) : null}
    </div>
  )
}

function RecipientsListPanel({
  status,
  emails,
  hasMore,
  loadMoreStatus,
  onLoadMore,
}: {
  status: 'idle' | 'loading' | 'success' | 'error'
  emails: string[]
  hasMore: boolean
  loadMoreStatus: 'idle' | 'loading' | 'success' | 'error'
  onLoadMore: () => void
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] light:border-neutral-200 light:bg-neutral-50">
      {status === 'loading' ? (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-white/40 light:text-neutral-400">
          <Loader2 className="animate-spin" size={14} />
          Loading recipients…
        </div>
      ) : emails.length === 0 ? (
        <p className="px-4 py-3 text-sm text-white/40 light:text-neutral-400">No recipients to show.</p>
      ) : (
        <>
          <ul className="max-h-56 divide-y divide-white/10 overflow-y-auto light:divide-neutral-100">
            {emails.map((email) => (
              <li key={email} className="truncate px-4 py-2 text-sm text-white/80 light:text-neutral-700">
                {email}
              </li>
            ))}
          </ul>
          {hasMore ? (
            <div className="flex justify-center border-t border-white/10 py-2 light:border-neutral-100">
              <button
                type="button"
                disabled={loadMoreStatus === 'loading'}
                onClick={onLoadMore}
                className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 light:text-neutral-600 light:hover:bg-neutral-100"
              >
                {loadMoreStatus === 'loading' ? <Loader2 className="animate-spin" size={12} /> : null}
                Load more
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function SendConfirmDialog({
  preview,
  isSending,
  error,
  scheduledAtIso,
  onCancel,
  onConfirm,
}: {
  preview: { recipientCount: number; remaining: number; monthlyLimit: number } | null
  isSending: boolean
  error: string | null
  scheduledAtIso: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  const scheduledLabel = scheduledAtIso
    ? new Date(scheduledAtIso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6 shadow-2xl light:border-neutral-200 light:bg-white">
        <div className="grid size-11 place-items-center rounded-xl bg-accent/15">
          <CheckCircle2 className="text-accent-strong" size={20} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white light:text-neutral-950">
          {scheduledLabel ? 'Schedule this email?' : 'Send this email?'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-500">
          {scheduledLabel ? (
            <>
              This will send to an estimated{' '}
              <span className="font-medium text-white/80 light:text-neutral-800">
                {preview?.recipientCount ?? 0} recipient{preview?.recipientCount === 1 ? '' : 's'}
              </span>{' '}
              on <span className="font-medium text-white/80 light:text-neutral-800">{scheduledLabel}</span>. You
              can cancel it any time before then.
            </>
          ) : (
            <>
              This will immediately email{' '}
              <span className="font-medium text-white/80 light:text-neutral-800">
                {preview?.recipientCount ?? 0} recipient{preview?.recipientCount === 1 ? '' : 's'}
              </span>
              . This cannot be undone.
            </>
          )}
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
            {scheduledLabel ? 'Schedule' : 'Send now'}
          </button>
        </div>
      </div>
    </div>
  )
}
