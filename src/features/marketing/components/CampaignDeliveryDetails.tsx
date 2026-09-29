import { Loader2, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCampaignStore } from '../model/campaign-store'
import type { CampaignListItem } from '../model/types'

export function CampaignDetailPanel({ slug, campaign }: { slug: string; campaign: CampaignListItem }) {
  const failedRecipients = useCampaignStore((s) => s.failedRecipients)
  const failedRecipientsStatus = useCampaignStore((s) => s.failedRecipientsStatus)
  const loadFailedRecipients = useCampaignStore((s) => s.loadFailedRecipients)
  const clearFailedRecipients = useCampaignStore((s) => s.clearFailedRecipients)
  const resendFailedStatus = useCampaignStore((s) => s.resendFailedStatus)
  const resendFailedError = useCampaignStore((s) => s.resendFailedError)
  const resendFailedForSlug = useCampaignStore((s) => s.resendFailedForSlug)
  const resetResendFailedFeedback = useCampaignStore((s) => s.resetResendFailedFeedback)
  const [isConfirmingResend, setIsConfirmingResend] = useState(false)

  const showFailedRecipients = campaign.status === 'Queued' && campaign.failedCount > 0

  useEffect(() => {
    if (showFailedRecipients) void loadFailedRecipients(slug, campaign.publicId)
    return () => clearFailedRecipients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, campaign.publicId, showFailedRecipients])

  const deliveryRate = campaign.recipientCount > 0
    ? `${Math.round((campaign.sentCount / campaign.recipientCount) * 100)}%`
    : '—'

  return (
    <div className="px-5 pb-5" onClick={(e) => e.stopPropagation()}>
      <div
        className="flex gap-6 p-4 rounded-lg"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <CampaignStat label="Recipients" value={String(campaign.recipientCount)} color="var(--color-chart-1)" />
        <CampaignStat label="Delivered" value={String(campaign.sentCount)} color="rgb(52 211 153)" />
        <CampaignStat label="Failed" value={String(campaign.failedCount)} color="var(--color-chart-4)" />
        <CampaignStat label="Delivery Rate" value={deliveryRate} color="var(--color-chart-5)" />
      </div>

      {campaign.status === 'Failed' && campaign.note ? (
        <p className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 light:bg-red-50 light:text-red-700">
          {campaign.note}
        </p>
      ) : null}

      {showFailedRecipients ? (
        <div className="mt-3 grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white light:text-neutral-950">
              Failed ({campaign.failedCount})
            </p>
            <button
              type="button"
              onClick={() => { resetResendFailedFeedback(); setIsConfirmingResend(true) }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-white/70 transition hover:bg-secondary light:text-neutral-600"
            >
              <RotateCcw size={13} />
              Resend failed
            </button>
          </div>
          <p className="text-xs text-white/40 light:text-neutral-400">
            Monthly limit was refunded for failed recipients — resending does not charge it again.
          </p>
          {resendFailedStatus === 'error' && resendFailedError ? (
            <p className="text-xs text-red-400 light:text-red-500">{resendFailedError}</p>
          ) : null}

          {failedRecipientsStatus === 'loading' ? (
            <div className="flex items-center gap-2 text-sm text-white/40 light:text-neutral-400">
              <Loader2 className="animate-spin" size={14} />
              Loading failed recipients…
            </div>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {failedRecipients.map((recipient) => (
                <li key={recipient.email} className="px-4 py-3">
                  <p className="text-sm font-medium text-white light:text-neutral-950">{recipient.email}</p>
                  {recipient.lastError ? (
                    <p className="mt-0.5 truncate text-xs text-white/40 light:text-neutral-400">{recipient.lastError}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {isConfirmingResend ? (
        <ResendFailedConfirmDialog
          failedCount={campaign.failedCount}
          isSubmitting={resendFailedStatus === 'submitting'}
          onCancel={() => setIsConfirmingResend(false)}
          onConfirm={async () => {
            const requeued = await resendFailedForSlug(slug, campaign.publicId)
            if (requeued !== null) setIsConfirmingResend(false)
          }}
        />
      ) : null}
    </div>
  )
}

export function CampaignStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-black font-mono" style={{ color }}>{value}</p>
    </div>
  )
}

export function ResendFailedConfirmDialog({
  failedCount,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  failedCount: number
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-white light:text-neutral-950">
          Resend to {failedCount} failed recipient{failedCount === 1 ? '' : 's'}?
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-500">
          They'll be retried with the same content. This does not use any of your monthly email
          allowance.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="flex h-9 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-white/70 transition hover:bg-secondary light:text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong disabled:opacity-40"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : null}
            Resend
          </button>
        </div>
      </div>
    </div>
  )
}

export function CancelScheduleConfirmDialog({
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-base font-semibold text-white light:text-neutral-950">Cancel this scheduled send?</h2>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-500">
          It will never be dispatched. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="flex h-9 flex-1 items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-white/70 transition hover:bg-secondary light:text-neutral-700"
          >
            Keep it
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-40"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : null}
            Cancel send
          </button>
        </div>
      </div>
    </div>
  )
}
