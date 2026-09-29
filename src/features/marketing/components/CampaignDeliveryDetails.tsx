import { Loader2, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GhostBtn, Modal, PrimaryBtn } from '../../../shared/ui/figma'
import { useCampaignStore } from '../model/campaign-store'
import { formatDateTime } from '../model/format-date'
import type { CampaignListItem } from '../model/types'

/** Inline delivery details of one sent campaign: counts, failed recipients, resend and cancel-schedule. */
export function CampaignDetailPanel({ slug, campaign }: { slug: string; campaign: CampaignListItem }) {
  const failedRecipients = useCampaignStore((s) => s.failedRecipients)
  const failedRecipientsStatus = useCampaignStore((s) => s.failedRecipientsStatus)
  const loadFailedRecipients = useCampaignStore((s) => s.loadFailedRecipients)
  const clearFailedRecipients = useCampaignStore((s) => s.clearFailedRecipients)
  const resendFailedStatus = useCampaignStore((s) => s.resendFailedStatus)
  const resendFailedError = useCampaignStore((s) => s.resendFailedError)
  const resendFailedForSlug = useCampaignStore((s) => s.resendFailedForSlug)
  const resetResendFailedFeedback = useCampaignStore((s) => s.resetResendFailedFeedback)
  const cancelScheduleStatus = useCampaignStore((s) => s.cancelScheduleStatus)
  const cancelScheduleError = useCampaignStore((s) => s.cancelScheduleError)
  const cancelScheduledCampaignForSlug = useCampaignStore((s) => s.cancelScheduledCampaignForSlug)
  const resetCancelScheduleFeedback = useCampaignStore((s) => s.resetCancelScheduleFeedback)
  const [isConfirmingResend, setIsConfirmingResend] = useState(false)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)

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
    <div className="px-3.5 pb-3.5">
      <div className="border-t border-border pt-3">
        {campaign.status === 'Queued' && (
          <div className="flex gap-5">
            <DetailStat label="Recipients" value={String(campaign.recipientCount)} />
            <DetailStat label="Delivered" value={String(campaign.sentCount)} color="var(--color-chart-1)" />
            <DetailStat label="Failed" value={String(campaign.failedCount)} color="var(--color-chart-4)" />
            <DetailStat label="Delivery rate" value={deliveryRate} color="var(--color-chart-5)" />
          </div>
        )}

        {campaign.status === 'Scheduled' && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              Goes out {campaign.scheduledAt ? formatDateTime(campaign.scheduledAt) : 'at the scheduled time'}. The
              audience is resolved again at send time.
            </p>
            <GhostBtn
              className="shrink-0"
              onClick={() => {
                resetCancelScheduleFeedback()
                setIsConfirmingCancel(true)
              }}
            >
              Cancel schedule
            </GhostBtn>
          </div>
        )}

        {campaign.status === 'Cancelled' && (
          <p className="text-[11px] text-muted-foreground">This scheduled send was cancelled and never went out.</p>
        )}

        {campaign.status === 'Failed' && (
          <p className="text-[11px]" style={{ color: 'var(--color-chart-4)' }}>
            {campaign.note ?? 'This scheduled send could not be dispatched.'}
          </p>
        )}

        {showFailedRecipients && (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-xs font-medium">Failed ({campaign.failedCount})</p>
              <GhostBtn
                icon={<RotateCcw size={12} />}
                onClick={() => {
                  resetResendFailedFeedback()
                  setIsConfirmingResend(true)
                }}
              >
                Resend failed
              </GhostBtn>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">
              The monthly limit was refunded for failed recipients — resending does not charge it again.
            </p>

            {failedRecipientsStatus === 'loading' ? (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="animate-spin" size={12} />
                Loading failed recipients…
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {failedRecipients.map((recipient) => (
                  <li key={recipient.email} className="px-3 py-2">
                    <p className="text-xs">{recipient.email}</p>
                    {recipient.lastError && (
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{recipient.lastError}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Modal
        open={isConfirmingResend}
        title={`Resend to ${campaign.failedCount} failed recipient${campaign.failedCount === 1 ? '' : 's'}?`}
        onClose={() => setIsConfirmingResend(false)}
        dismissable={resendFailedStatus !== 'submitting'}
      >
        <p className="text-sm text-muted-foreground mb-5">
          They'll be retried with the same content. This does not use any of your monthly email allowance.
        </p>
        {resendFailedStatus === 'error' && resendFailedError && (
          <p className="text-xs mb-3" style={{ color: 'var(--color-chart-4)' }}>
            {resendFailedError}
          </p>
        )}
        <div className="flex gap-2">
          <PrimaryBtn
            className="flex-1 justify-center"
            loading={resendFailedStatus === 'submitting'}
            onClick={async () => {
              const requeued = await resendFailedForSlug(slug, campaign.publicId)
              if (requeued !== null) setIsConfirmingResend(false)
            }}
          >
            Resend
          </PrimaryBtn>
          <GhostBtn className="px-5" disabled={resendFailedStatus === 'submitting'} onClick={() => setIsConfirmingResend(false)}>
            Cancel
          </GhostBtn>
        </div>
      </Modal>

      <Modal
        open={isConfirmingCancel}
        title="Cancel this scheduled send?"
        onClose={() => setIsConfirmingCancel(false)}
        dismissable={cancelScheduleStatus !== 'submitting'}
      >
        <p className="text-sm text-muted-foreground mb-5">It will never be dispatched. This cannot be undone.</p>
        {cancelScheduleStatus === 'error' && cancelScheduleError && (
          <p className="text-xs mb-3" style={{ color: 'var(--color-chart-4)' }}>
            {cancelScheduleError}
          </p>
        )}
        <div className="flex gap-2">
          <PrimaryBtn
            className="flex-1 justify-center"
            loading={cancelScheduleStatus === 'submitting'}
            onClick={async () => {
              const ok = await cancelScheduledCampaignForSlug(slug, campaign.publicId)
              if (ok) setIsConfirmingCancel(false)
            }}
          >
            Cancel send
          </PrimaryBtn>
          <GhostBtn className="px-5" disabled={cancelScheduleStatus === 'submitting'} onClick={() => setIsConfirmingCancel(false)}>
            Keep it
          </GhostBtn>
        </div>
      </Modal>
    </div>
  )
}

function DetailStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-mono mt-0.5" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  )
}
