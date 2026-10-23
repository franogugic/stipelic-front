import { ArrowUpRight, CalendarClock, CircleAlert, Info, Lock, MailX, Send } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { date, dateTime, number, plural } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import { EmailPreview } from '../../../shared/ui/EmailPreview'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Meter,
  PageHeader,
  Segmented,
  SkeletonBlock,
  SkeletonRows,
  Textarea,
  useToast,
} from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { getAudiencePreview, getCampaign, sendCampaign } from '../api/campaigns-api'
import { ScheduleModal } from '../components/ScheduleModal'
import { SendConfirmModal } from '../components/SendConfirmModal'
import { SendingPanel } from '../components/SendingPanel'
import { useCampaignStore } from '../model/campaign-store'
import { BODY_MAX_LENGTH, CTA_LABEL_MAX_LENGTH, CTA_URL_MAX_LENGTH, SUBJECT_MAX_LENGTH } from '../model/mail-content-rules'
import { ESTIMATED_OPENS, nextResendRound, resendStateOf, suggestedResendSubject } from '../model/resend'
import { nextReset } from '../model/schedule'
import type { AudiencePreview, CampaignDetail } from '../model/types'
import { RESEND_LIMIT } from '../model/types'

type Original = { key: string; status: 'ready'; campaign: CampaignDetail } | { key: string; status: 'notfound' | 'error' }
type Content = { subject: string; bodyText: string; ctaLabel: string; ctaUrl: string }

/** Server codes of a refused resend: the card behind this page has changed, so it is read again. */
const STATE_CHANGED_CODES = ['LIMIT_REACHED', 'RESEND_PENDING', 'TOO_LATE', 'TOO_EARLY', 'NO_RECIPIENTS', 'NOT_SENT', 'IS_RESEND']

/**
 * The wizard in resend mode (`/emails/new?mode=resend&of=<original>`): the audience is fixed to the people who did not
 * open the original (or an earlier resend), the subject is suggested for this round, the content comes from the original.
 * Whether a resend is possible, and for how many people, is the server's answer.
 */
export function ResendCampaignPage({ slug, originalPublicId }: { slug: string; originalPublicId: string }) {
  const toast = useToast()
  const navigate = useNavigate()
  const loadCampaigns = useCampaignStore((s) => s.loadCampaigns)

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorSettings = useCreatorStore((s) => s.creatorSettings)
  const loadCreatorSettings = useCreatorStore((s) => s.loadCreatorSettings)
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  const key = `${slug}|${originalPublicId}`
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Original | null>(null)
  const state = loaded?.key === key ? loaded : null
  const original = state?.status === 'ready' ? state.campaign : null
  const resend = original ? resendStateOf(original) : null

  const [openedAt] = useState(() => Date.now())
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [content, setContent] = useState<{ key: string; value: Content } | null>(null)
  const [attempted, setAttempted] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [schedule, setSchedule] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sent, setSent] = useState<CampaignDetail | null>(null)

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (slug) void loadCreatorSettings(slug)
  }, [slug, loadCreatorSettings])

  useEffect(() => {
    if (!slug || !originalPublicId) return
    let active = true
    getCampaign(slug, originalPublicId)
      .then((campaign) => active && setLoaded({ key, status: 'ready', campaign }))
      .catch((error) => active && setLoaded({ key, status: error instanceof ApiError && error.status === 404 ? 'notfound' : 'error' }))
    return () => {
      active = false
    }
  }, [slug, originalPublicId, key, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  // The sends left this month, for this audience. A result belongs to the original it was fetched for.
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const [previewResult, setPreviewResult] = useState<{ key: string; data: AudiencePreview | null } | null>(null)
  const previewKey = `${key}|${previewAttempt}`
  const eligible = Boolean(resend?.eligible)
  useEffect(() => {
    if (!eligible) return
    let active = true
    getAudiencePreview(slug, 'CampaignNonOpeners', originalPublicId)
      .then((data) => active && setPreviewResult({ key: previewKey, data }))
      .catch(() => active && setPreviewResult({ key: previewKey, data: null }))
    return () => {
      active = false
    }
  }, [slug, originalPublicId, eligible, previewKey])
  const previewState = previewResult?.key === previewKey ? previewResult : null
  const preview = previewState?.data ?? null
  const previewFailed = previewState !== null && preview === null

  if (!slug || !originalPublicId) return null

  // The wizard starts from the original's message and this round's suggested subject; the creator may change all of it.
  const initial: Content | null =
    original && resend
      ? {
          subject: suggestedResendSubject(nextResendRound(resend), original.subject),
          bodyText: original.bodyText,
          ctaLabel: original.ctaLabel ?? '',
          ctaUrl: original.ctaUrl ?? '',
        }
      : null
  const fields: Content | null = content?.key === key ? content.value : initial
  const setField = (field: keyof Content, value: string) => {
    if (fields) setContent({ key, value: { ...fields, [field]: value } })
  }

  const brandName = creatorSettings?.brandName || creator?.name || ''
  const supportEmail = creatorSettings?.supportEmail ?? ''
  const originalHref = `/app/${slug}/emails/campaigns/${originalPublicId}`

  const recipientCount = preview?.recipientCount ?? resend?.recipientCount ?? null
  const remaining = preview && preview.monthlyLimit >= 0 ? preview.remaining : null
  const left = remaining ?? 0
  const overLimit = recipientCount !== null && remaining !== null && recipientCount > remaining
  const noAudience = recipientCount === 0
  const windowEnds = resend?.eligibleUntil ? new Date(resend.eligibleUntil) : null
  const resetAt = nextReset(openedAt)
  // Scheduling past the monthly reset is only offered while that moment is still inside the resend window.
  const resetInsideWindow = windowEnds === null || resetAt <= windowEnds
  const sendTip = overLimit
    ? `Only ${number(left)} sends left this month — schedule it for after the reset`
    : noAudience
      ? 'Nobody is left to resend to'
      : undefined

  const subjectError = fields && fields.subject.trim().length > 0 ? null : 'Add a subject.'
  const bodyError = fields && fields.bodyText.trim().length > 0 ? null : 'Write a message.'
  const ctaSet = Boolean(fields?.ctaLabel.trim())
  const ctaError = ctaSet !== Boolean(fields?.ctaUrl.trim()) ? 'Set both a button label and a button URL, or leave both empty.' : null
  const contentValid = subjectError === null && bodyError === null && ctaError === null

  const validate = () => {
    setAttempted(true)
    return contentValid
  }
  const askSend = () => {
    if (!validate()) return
    setSendError(null)
    setConfirming(true)
  }
  const askSchedule = () => {
    if (!validate()) return
    setSendError(null)
    setSchedule((current) => (current ?? 0) + 1)
  }

  /** Sends (or schedules) the resend. A refusal that means the card behind this page changed re-reads it. */
  const submit = async (scheduledAt?: string) => {
    if (!fields || !resend) return null
    setBusy(true)
    setSendError(null)
    try {
      const campaign = await sendCampaign(slug, {
        subject: fields.subject.trim(),
        bodyText: fields.bodyText,
        ...(ctaSet ? { ctaLabel: fields.ctaLabel.trim(), ctaUrl: fields.ctaUrl.trim() } : {}),
        audienceType: 'CampaignNonOpeners',
        targetPublicId: originalPublicId,
        ...(scheduledAt ? { scheduledAt } : {}),
      })
      void loadCampaigns(slug)
      return campaign
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'We could not send this resend. Please try again.'
      if (error instanceof ApiError && ((error.code && STATE_CHANGED_CODES.includes(error.code)) || error.status === 409)) {
        // What the page was built on has changed (a resend is already scheduled, the window closed, …): say so and read
        // the campaign again — the page then explains the new state.
        setConfirming(false)
        setSchedule(null)
        toast({ tone: 'danger', title: 'Couldn’t send this resend', message })
        reload()
      } else {
        setSendError(message)
      }
      return null
    } finally {
      setBusy(false)
    }
  }

  const sendNow = async () => {
    const campaign = await submit()
    if (campaign) {
      setConfirming(false)
      setSent(campaign)
    }
  }

  const scheduleFor = async (at: Date) => {
    const round = resend ? nextResendRound(resend) : 1
    const campaign = await submit(at.toISOString())
    if (!campaign) return
    setSchedule(null)
    toast({ tone: 'success', title: `Resend ${round} scheduled`, message: `It goes out on ${dateTime(at)}.` })
    navigate(originalHref)
  }

  const blocked = () => {
    const why =
      resend?.reason === 'LIMIT_REACHED'
        ? `All ${resend.limit} resends of this campaign are used.`
        : resend?.reason === 'RESEND_PENDING'
          ? 'Another resend of this campaign is still scheduled. The next one can be planned once it has been sent.'
          : resend?.reason === 'TOO_EARLY'
            ? `A resend is possible from ${resend.eligibleFrom ? dateTime(resend.eligibleFrom) : '24 hours after the last send'}.`
            : resend?.reason === 'TOO_LATE'
              ? 'The resend window for this campaign has closed. Resends are possible for 30 days after sending.'
              : resend?.reason === 'NO_RECIPIENTS'
                ? 'Everyone who got it has opened it or unsubscribed — there’s no one left to resend to.'
                : 'This campaign can’t be resent.'
    return (
      <EmptyState
        icon={MailX}
        title="This campaign can’t be resent right now"
        text={why}
        action={{ label: 'Back to the campaign', variant: 'secondary', to: originalHref }}
      />
    )
  }

  const audienceNote = () => {
    if (!resend) return null
    if (overLimit) {
      return (
        <div className="alert alert--warning" role="alert">
          <CircleAlert />
          <div className="alert__body">
            <p className="alert__title">Not enough sends left to send it now</p>
            <p>
              This resend needs {number(recipientCount ?? 0)} sends and you have {number(left)} left.{' '}
              {resetInsideWindow
                ? `Schedule it for after your sends reset on ${date(resetAt)} — still inside the resend window — or upgrade your plan.`
                : `Resends close on ${windowEnds ? dateTime(windowEnds) : 'the last day of the window'}, before your sends reset on ${date(resetAt)}. Upgrade your plan to send it in time.`}{' '}
              The limit is checked when the resend goes out.
            </p>
            {preview && <Meter label="Sent this month" used={preview.usedThisMonth} limit={preview.monthlyLimit} />}
            <div className="cluster">
              {resetInsideWindow && (
                <Button variant="primary" icon={CalendarClock} onClick={askSchedule}>
                  Schedule after the reset
                </Button>
              )}
              <Button variant="accent" icon={ArrowUpRight} to={`/app/${slug}/settings?tab=billing`}>
                Upgrade plan
              </Button>
            </div>
          </div>
        </div>
      )
    }
    if (noAudience) {
      return (
        <Alert tone="warning" icon={MailX} title="No one left to resend to" live>
          Everyone who got it has opened it or unsubscribed.
        </Alert>
      )
    }
    if (previewFailed) {
      return (
        <Alert tone="warning" icon={CircleAlert} title="Couldn’t check your sends left">
          <Button variant="secondary" size="sm" onClick={() => setPreviewAttempt((n) => n + 1)}>
            Try again
          </Button>
        </Alert>
      )
    }
    if (preview === null || recipientCount === null) return <SkeletonBlock />
    return (
      <Alert tone="info" icon={Info} title={`${plural(recipientCount, 'recipient')}${windowEnds ? ` · must go out by ${dateTime(windowEnds)}` : ''}`}>
        {remaining === null
          ? `Your plan has unlimited sends. This resend uses ${number(recipientCount)}.`
          : `You have ${number(left)} sends left this month; this resend uses ${number(recipientCount)}.`}{' '}
        Resends close 30 days after the original was sent.
      </Alert>
    )
  }

  const form = () => {
    if (!original || !resend || !fields) return null
    const round = nextResendRound(resend)
    const usedSubjects = resend.resends.filter((item) => item.status !== 'Cancelled').map((item) => item.subject)
    const people = plural(recipientCount ?? 0, 'person', 'people')
    return (
      <>
        <PageHeader
          eyebrow={`Email marketing · Resend ${round} of ${RESEND_LIMIT}`}
          title={
            <>
              Resend to <em>non-openers</em>
            </>
          }
          actions={
            <>
              <Button variant="ghost" to={originalHref}>
                Cancel
              </Button>
              <Button variant="secondary" icon={CalendarClock} disabledReason={noAudience ? sendTip : undefined} onClick={askSchedule}>
                Schedule
              </Button>
              <Button variant="accent" icon={Send} disabledReason={sendTip} onClick={askSend}>
                Send now
              </Button>
            </>
          }
        />
        <div className="grid grid--2 grid--gap-lg">
          <div className="stack stack--lg">
            <Card
              title="Audience"
              subtitle={`Resend of “${original.subject}”`}
              action={
                <Button variant="ghost" icon={ArrowUpRight} to={originalHref}>
                  Original
                </Button>
              }
            >
              <div className="stack stack--sm">
                <div className="choice choice--locked" aria-label={`Audience: Didn’t open: ${original.subject}, ${people}`}>
                  <span className="cluster cluster--between cluster--nowrap">
                    <span className="cluster cluster--nowrap">
                      <MailX className="choice__icon" />
                      <span className="stack stack--xs">
                        <span className="choice__title">Didn’t open: {original.subject}</span>
                        <span className="text-xs text-muted">
                          {original.queuedAt ? `Got it on ${date(original.queuedAt)} · ` : ''}no open since
                        </span>
                      </span>
                    </span>
                    <Badge>{plural(recipientCount ?? 0, 'recipient')}</Badge>
                  </span>
                  <Lock className="choice__lock" />
                </div>
                <p className="text-sm text-secondary">
                  The audience is fixed for a resend. People who unsubscribed or whose address bounced are left out.
                </p>
                <p className="resend__hint">
                  <Info />
                  <span>{ESTIMATED_OPENS}</span>
                </p>
              </div>
            </Card>
            <Card title="Message">
              <div className="form">
                <Field
                  label="Subject"
                  hint={
                    usedSubjects.length > 0
                      ? `A new subject gets more opens than the same one twice. Used so far: ${usedSubjects.map((subject) => `“${subject}”`).join(', ')}.`
                      : 'A new subject gets more opens than the same one twice.'
                  }
                  error={attempted ? (subjectError ?? undefined) : undefined}
                >
                  {(control) => (
                    <Input
                      {...control}
                      maxLength={SUBJECT_MAX_LENGTH}
                      value={fields.subject}
                      onChange={(event) => setField('subject', event.target.value)}
                    />
                  )}
                </Field>
                <Field
                  label="Message"
                  hint="The original message — change it if you like."
                  error={attempted ? (bodyError ?? undefined) : undefined}
                >
                  {(control) => (
                    <Textarea
                      {...control}
                      rows={7}
                      maxLength={BODY_MAX_LENGTH}
                      value={fields.bodyText}
                      onChange={(event) => setField('bodyText', event.target.value)}
                    />
                  )}
                </Field>
                <div className="form-row">
                  <Field label="Button text" error={attempted && !fields.ctaLabel.trim() ? (ctaError ?? undefined) : undefined}>
                    {(control) => (
                      <Input
                        {...control}
                        maxLength={CTA_LABEL_MAX_LENGTH}
                        value={fields.ctaLabel}
                        onChange={(event) => setField('ctaLabel', event.target.value)}
                      />
                    )}
                  </Field>
                  <Field label="Button URL" error={attempted && !fields.ctaUrl.trim() ? (ctaError ?? undefined) : undefined}>
                    {(control) => (
                      <Input
                        {...control}
                        type="url"
                        maxLength={CTA_URL_MAX_LENGTH}
                        placeholder="https://"
                        value={fields.ctaUrl}
                        onChange={(event) => setField('ctaUrl', event.target.value)}
                      />
                    )}
                  </Field>
                </div>
              </div>
            </Card>
            {audienceNote()}
          </div>
          <Card
            title="Preview"
            action={
              <Segmented
                label="Preview size"
                options={[
                  { value: 'desktop', label: 'Desktop' },
                  { value: 'mobile', label: 'Mobile' },
                ]}
                value={device}
                onChange={(value) => setDevice(value as 'desktop' | 'mobile')}
              />
            }
          >
            <EmailPreview
              brandName={brandName}
              supportEmail={supportEmail}
              brandColor={creatorSettings?.primaryColor || '#CDF24B'}
              subject={fields.subject}
              body={fields.bodyText}
              button={fields.ctaLabel.trim() ? { label: fields.ctaLabel.trim() } : undefined}
              device={device}
            />
          </Card>
        </div>

        <SendConfirmModal
          open={confirming}
          recipientCount={recipientCount ?? 0}
          subject={fields.subject.trim()}
          audienceTitle={`Didn’t open: ${original.subject}`}
          from={supportEmail ? `${brandName} <${supportEmail}>` : null}
          sendsLeftAfter={remaining === null ? null : Math.max(0, left - (recipientCount ?? 0))}
          busy={busy}
          error={sendError}
          resend={{ round, limit: resend.limit }}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void sendNow()}
        />
        {schedule !== null && (
          <ScheduleModal
            key={schedule}
            open
            afterReset={overLimit && resetInsideWindow}
            subject={fields.subject.trim()}
            recipientCount={recipientCount}
            busy={busy}
            error={sendError}
            resend={{ latest: windowEnds ?? new Date(openedAt + 30 * 86_400_000) }}
            onClose={() => setSchedule(null)}
            onSchedule={(at) => void scheduleFor(at)}
          />
        )}
      </>
    )
  }

  const body = () => {
    if (state === null) return <SkeletonRows />
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
    if (state.status === 'error' || !original) return <ErrorState onRetry={reload} />
    if (sent) return <SendingPanel slug={slug} initial={sent} resend={{ round: sent.resendRound ?? 1, limit: RESEND_LIMIT, originalPublicId }} />
    if (!resend || !resend.eligible) return blocked()
    return form()
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
