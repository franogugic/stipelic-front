import { CalendarX, CircleAlert, MailX, RotateCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { dateTime, number, plural } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import { EmailPreview } from '../../../shared/ui/EmailPreview'
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  KeyValue,
  Modal,
  PageHeader,
  SkeletonCards,
  SkeletonRows,
  StatusBadge,
  campaignSendingLabel,
  campaignStatusKey,
  useToast,
} from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useLandingPageStore } from '../../landing-pages/model/landing-page-store'
import { useProductStore } from '../../products/model/product-store'
import { getAudiencePreview, getCampaign } from '../api/campaigns-api'
import { CampaignResultsBoard } from '../components/CampaignResultsBoard'
import { CampaignStatusAlert } from '../components/CampaignStatusAlert'
import { FailedRecipientsCard } from '../components/FailedRecipientsCard'
import { ResendCard } from '../components/ResendCard'
import { ResendOrigin } from '../components/ResendOrigin'
import { useCampaignStore } from '../model/campaign-store'
import { campaignGroup } from '../model/campaign-groups'
import { isCampaignComplete } from '../model/campaign-progress'
import { userTimezone } from '../model/schedule'
import { RESEND_LIMIT } from '../model/types'
import type { AudiencePreview, CampaignDetail } from '../model/types'
import { useAudienceName } from '../model/use-audience-name'

const POLL_INTERVAL_MS = 3000

type Loaded = { key: string; status: 'ready'; campaign: CampaignDetail } | { key: string; status: 'notfound' | 'error' }

/** One campaign: delivery numbers, failed recipients (with resend), the message, and cancelling a schedule. */
export function CampaignDetailPage() {
  const toast = useToast()
  const { slug = '', campaignId = '' } = useParams<{ slug: string; campaignId: string }>()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorSettings = useCreatorStore((s) => s.creatorSettings)
  const loadCreatorSettings = useCreatorStore((s) => s.loadCreatorSettings)
  const loadPages = useLandingPageStore((s) => s.loadPages)
  const loadProducts = useProductStore((s) => s.loadProducts)
  const audienceName = useAudienceName()
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  const failedRecipients = useCampaignStore((s) => s.failedRecipients)
  const failedRecipientsStatus = useCampaignStore((s) => s.failedRecipientsStatus)
  const allCampaigns = useCampaignStore((s) => s.campaigns)
  const loadCampaigns = useCampaignStore((s) => s.loadCampaigns)
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

  const key = `${slug}|${campaignId}`
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [confirming, setConfirming] = useState<'resend' | 'cancel' | null>(null)
  const state = loaded?.key === key ? loaded : null
  const campaign = state?.status === 'ready' ? state.campaign : null

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (!slug) return
    void loadCreatorSettings(slug)
    void loadPages(slug)
    void loadProducts(slug)
    void loadCampaigns(slug)
  }, [slug, loadCreatorSettings, loadPages, loadProducts, loadCampaigns])

  useEffect(() => {
    if (!slug || !campaignId) return
    getCampaign(slug, campaignId)
      .then((data) => setLoaded({ key, status: 'ready', campaign: data }))
      .catch((error) => setLoaded({ key, status: error instanceof ApiError && error.status === 404 ? 'notfound' : 'error' }))
  }, [slug, campaignId, key, attempt])

  // A campaign that is still going out is re-read every 3 s; a resend makes a finished one incomplete again.
  const complete = campaign === null ? true : isCampaignComplete(campaign)
  useEffect(() => {
    if (complete) return
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      try {
        const latest = await getCampaign(slug, campaignId)
        if (!active) return
        setLoaded({ key, status: 'ready', campaign: latest })
        if (isCampaignComplete(latest)) return
      } catch {
        // A missed poll is not a failed send; try again on the next tick.
      }
      if (active) timer = setTimeout(() => void poll(), POLL_INTERVAL_MS)
    }
    timer = setTimeout(() => void poll(), POLL_INTERVAL_MS)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [complete, slug, campaignId, key])

  // The audience's size right now (a scheduled campaign has no recipients yet) and the sends left this month (a resend
  // uses them), both from the same preview.
  const needsPreview = campaign !== null && (campaign.status === 'Scheduled' || (campaign.status === 'Queued' && campaign.failedCount > 0))
  const audienceType = needsPreview ? campaign.audienceType : null
  const audienceTarget = needsPreview ? campaign.targetPublicId : null
  const previewKey = `${key}|${audienceType}|${audienceTarget}`
  const [previewResult, setPreviewResult] = useState<{ key: string; data: AudiencePreview | null } | null>(null)
  useEffect(() => {
    if (!audienceType) return
    getAudiencePreview(slug, audienceType, audienceTarget)
      .then((data) => setPreviewResult({ key: previewKey, data }))
      .catch(() => setPreviewResult({ key: previewKey, data: null }))
  }, [slug, audienceType, audienceTarget, previewKey])
  const preview = previewResult?.key === previewKey ? previewResult.data : null
  const currentAudienceSize = campaign?.status === 'Scheduled' ? (preview?.recipientCount ?? null) : null
  const sendsLeft = preview && preview.monthlyLimit >= 0 ? preview.remaining : null

  const failedCount = campaign?.failedCount ?? 0
  const showFailed = campaign?.status === 'Queued' && failedCount > 0
  useEffect(() => {
    if (showFailed) void loadFailedRecipients(slug, campaignId)
  }, [showFailed, failedCount, slug, campaignId, loadFailedRecipients])
  useEffect(() => () => clearFailedRecipients(), [clearFailedRecipients])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  if (!slug) return null

  const confirmResend = async () => {
    const requeued = await resendFailedForSlug(slug, campaignId)
    if (requeued === null) return
    setConfirming(null)
    toast({ tone: 'success', title: 'Retrying', message: `${plural(requeued, 'email')} ${requeued === 1 ? 'is' : 'are'} on their way.` })
    reload()
  }

  const confirmCancel = async () => {
    if (!(await cancelScheduledCampaignForSlug(slug, campaignId))) return
    setConfirming(null)
    toast({ tone: 'success', title: 'Campaign cancelled' })
    reload()
  }

  const body = () => {
    if (state === null) {
      return (
        <div className="stack stack--lg">
          <SkeletonCards count={4} />
          <SkeletonRows count={4} />
        </div>
      )
    }
    if (state.status === 'notfound') {
      return (
        <EmptyState
          icon={MailX}
          title="Campaign not found"
          text="It may have been removed, or the link is wrong."
          action={{ label: 'Back to email marketing', variant: 'secondary', to: `/app/${slug}/emails` }}
        />
      )
    }
    if (state.status === 'error' || campaign === null) return <ErrorState onRetry={reload} />

    const statusKey = campaignStatusKey(campaign)
    const done = statusKey === 'sent' || statusKey === 'sending' || statusKey === 'failed'
    const recipients = campaign.recipientCount
    // Your other sent campaigns: what "vs your average" compares with. Resends go only to people who didn't open, so they
    // would drag every average down: originals only.
    const others = allCampaigns.filter(
      (other) => other.publicId !== campaign.publicId && !other.sourceCampaignPublicId && campaignGroup(other) === 'sent',
    )
    const audience = audienceName(campaign)
    const zone = userTimezone(new Date(campaign.createdAt)).zone
    const when = campaign.queuedAt
      ? `Sent ${dateTime(campaign.queuedAt)}`
      : campaign.scheduledAt
        ? `Scheduled for ${dateTime(campaign.scheduledAt)}`
        : undefined
    const brandName = creatorSettings?.brandName || creator?.name || ''
    const supportEmail = creatorSettings?.supportEmail ?? ''
    const failedEmpty =
      statusKey === 'failed'
        ? { title: 'Nothing was delivered', text: `All ${number(recipients)} emails failed together — see the reason above.` }
        : done
          ? { title: 'No failed recipients', text: 'Every email reached its inbox server.' }
          : { title: 'Not sent yet', text: 'Failures will show here after sending.' }

    return (
      <>
        <PageHeader
          eyebrow={campaign.sourceCampaignPublicId ? `Campaign · Resend ${campaign.resendRound ?? 1} of ${RESEND_LIMIT}` : `Campaign · ${audience}`}
          title={campaign.subject}
          subtitle={when}
          actions={
            <>
              <StatusBadge
                kind="campaign"
                value={statusKey}
                label={statusKey === 'sending' ? campaignSendingLabel(campaign) : undefined}
              />
              {campaign.failedCount > 0 && campaign.status === 'Queued' && (
                <Button
                  variant="secondary"
                  icon={RotateCw}
                  onClick={() => {
                    resetResendFailedFeedback()
                    setConfirming('resend')
                  }}
                >
                  Retry failed ({number(campaign.failedCount)})
                </Button>
              )}
              {campaign.status === 'Scheduled' && (
                <Button
                  variant="danger-ghost"
                  icon={CalendarX}
                  onClick={() => {
                    resetCancelScheduleFeedback()
                    setConfirming('cancel')
                  }}
                >
                  Cancel schedule
                </Button>
              )}
            </>
          }
        />
        <div className="stack stack--lg reveal">
          <CampaignStatusAlert campaign={campaign} zone={zone} audienceSize={currentAudienceSize} />
          {campaign.sourceCampaignPublicId && <ResendOrigin slug={slug} campaign={campaign} />}
          <CampaignResultsBoard
            campaign={campaign}
            audience={audience}
            recipients={statusKey === 'scheduled' ? currentAudienceSize : recipients}
            others={others}
          />
          <ResendCard slug={slug} campaign={campaign} />
          <div className="dash">
            <div className="span-7 stack">
              <FailedRecipientsCard
                recipients={showFailed ? failedRecipients : []}
                status={showFailed ? failedRecipientsStatus : 'success'}
                empty={failedEmpty}
                onRetry={() => void loadFailedRecipients(slug, campaignId)}
              />
              <Card title="Details">
                <KeyValue
                  items={[
                    { term: 'Audience', description: audience },
                    { term: 'From', description: brandName },
                    ...(supportEmail ? [{ term: 'Reply-to', description: supportEmail }] : []),
                    { term: 'Created', description: dateTime(campaign.createdAt) },
                  ]}
                />
              </Card>
            </div>
            <div className="span-5">
              <Card title="Message">
                <EmailPreview
                  brandName={brandName}
                  supportEmail={supportEmail}
                  brandColor={creatorSettings?.primaryColor || '#CDF24B'}
                  subject={campaign.subject}
                  body={campaign.bodyText}
                  button={campaign.ctaLabel ? { label: campaign.ctaLabel } : undefined}
                />
              </Card>
            </div>
          </div>
        </div>

        <Modal
          open={confirming === 'resend'}
          onClose={() => setConfirming(null)}
          dismissible={resendFailedStatus !== 'submitting'}
          size="sm"
          title={`Retry ${plural(campaign.failedCount, 'failed recipient')}?`}
          description={`We’ll try the ${number(campaign.failedCount)} addresses that failed once more. Addresses that don’t exist will probably fail again. ${
            sendsLeft === null
              ? 'This counts against your monthly sends.'
              : `This uses ${number(campaign.failedCount)} of your ${number(sendsLeft)} remaining sends.`
          }`}
          icon={RotateCw}
          actions={
            <>
              <Button variant="secondary" disabled={resendFailedStatus === 'submitting'} onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button variant="primary" icon={RotateCw} loading={resendFailedStatus === 'submitting'} onClick={() => void confirmResend()}>
                Retry
              </Button>
            </>
          }
        >
          {resendFailedError && (
            <Alert tone="danger" icon={CircleAlert} live>
              {resendFailedError}
            </Alert>
          )}
        </Modal>
        <ConfirmDialog
          open={confirming === 'cancel'}
          onCancel={() => setConfirming(null)}
          busy={cancelScheduleStatus === 'submitting'}
          title="Cancel this scheduled campaign?"
          text={`“${campaign.subject}” won’t be sent${campaign.scheduledAt ? ` on ${dateTime(campaign.scheduledAt)}` : ''}. It stays in your list as Cancelled and nothing counts against your limit.`}
          icon={CalendarX}
          confirmLabel="Cancel campaign"
          cancelLabel="Keep scheduled"
          onConfirm={() => void confirmCancel()}
        >
          {cancelScheduleError && (
            <Alert tone="danger" icon={CircleAlert} live>
              {cancelScheduleError}
            </Alert>
          )}
        </ConfirmDialog>
      </>
    )
  }

  return (
    <AppShell slug={slug} activeSection="emails">
      {creatorLoading ? (
        <SkeletonRows />
      ) : !creator ? (
        <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
      ) : (
        body()
      )}
    </AppShell>
  )
}
