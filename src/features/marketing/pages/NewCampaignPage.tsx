import { CalendarClock, CircleAlert, Info, Package, PanelsTopLeft, Send, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { date, dateTime, number, plural } from '../../../shared/lib/format'
import { AppShell } from '../../../shared/ui/AppShell'
import { EmailPreview } from '../../../shared/ui/EmailPreview'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Meter,
  PageHeader,
  Segmented,
  Select,
  SkeletonBlock,
  SkeletonRows,
  Textarea,
  useToast,
} from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { SendConfirmModal } from '../components/SendConfirmModal'
import { ScheduleModal } from '../components/ScheduleModal'
import { SendingPanel } from '../components/SendingPanel'
import { nextReset } from '../model/schedule'
import { BODY_MAX_LENGTH, CTA_LABEL_MAX_LENGTH, CTA_URL_MAX_LENGTH, SUBJECT_MAX_LENGTH } from '../model/mail-content-rules'
import { useCampaignComposer } from '../model/use-campaign-composer'
import type { CampaignDetail } from '../model/types'

type AudienceRow = { value: string; icon: LucideIcon; title: string; meta: string; count: number }

/** New campaign: pick an audience, write the message, then send it now or schedule it. */
export function NewCampaignPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { slug = '' } = useParams<{ slug: string }>()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorSettings = useCreatorStore((s) => s.creatorSettings)
  const loadCreatorSettings = useCreatorStore((s) => s.loadCreatorSettings)
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const creatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  const composer = useCampaignComposer({ slug })
  const { content, recipientCount, remaining, overLimit } = composer

  // The reset date shown in the over-limit note is measured from when the page opened.
  const [openedAt] = useState(() => Date.now())
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [attempted, setAttempted] = useState(false)
  const [confirmingSend, setConfirmingSend] = useState(false)
  // `null` = closed; the key remounts the modal so each opening starts fresh.
  const [schedule, setSchedule] = useState<{ key: number; afterReset: boolean } | null>(null)
  const [sent, setSent] = useState<CampaignDetail | null>(null)

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (slug) void loadCreatorSettings(slug)
  }, [slug, loadCreatorSettings])

  if (!slug) return null

  const audiences = composer.audiences
  const rows: AudienceRow[] = audiences
    ? [
        { value: 'all', icon: Users, title: 'All subscribers', meta: 'Everyone who is subscribed', count: audiences.all.recipientCount },
        ...audiences.landingPages.map((page) => ({
          value: `LandingPage:${page.publicId}`,
          icon: PanelsTopLeft,
          title: page.title,
          meta: 'Landing page',
          count: page.recipientCount,
        })),
        ...audiences.products.map((product) => ({
          value: `Product:${product.publicId}`,
          icon: Package,
          title: product.name,
          meta: 'Product',
          count: product.recipientCount,
        })),
      ]
    : []
  const selected = rows.find((row) => row.value === composer.selection) ?? null
  const noAudience = recipientCount === 0
  const left = remaining ?? 0
  const sendTip = overLimit
    ? `Only ${number(left)} sends left this month — schedule it for after the reset`
    : noAudience
      ? 'This audience has no subscribers yet'
      : undefined

  const brandName = creatorSettings?.brandName || creator?.name || ''
  const supportEmail = creatorSettings?.supportEmail ?? ''

  const validate = () => {
    setAttempted(true)
    return composer.contentValid
  }
  const askSend = () => {
    if (validate()) {
      composer.resetSendFeedback()
      setConfirmingSend(true)
    }
  }
  const askSchedule = (afterReset: boolean) => {
    if (!validate()) return
    composer.resetSendFeedback()
    setSchedule((current) => ({ key: (current?.key ?? 0) + 1, afterReset }))
  }

  const sendNow = async () => {
    const campaign = await composer.send()
    if (campaign) {
      setConfirmingSend(false)
      setSent(campaign)
    }
  }

  const scheduleFor = async (at: Date) => {
    const count = recipientCount
    const campaign = await composer.send(at.toISOString())
    if (!campaign) return
    setSchedule(null)
    toast({
      tone: 'success',
      title: 'Campaign scheduled',
      message: `It goes out on ${dateTime(at)}${count === null ? '' : ` to ${plural(count, 'subscriber')}`}.`,
    })
    navigate(`/app/${slug}/emails`)
  }

  const audienceNote = () => {
    if (overLimit) {
      return (
        <div className="alert alert--warning" role="alert">
          <CircleAlert />
          <div className="alert__body">
            <p className="alert__title">Not enough sends left to send it now</p>
            <p>
              This campaign needs {number(recipientCount ?? 0)} sends and you have {number(left)} left. Schedule it for after your sends
              reset on {date(nextReset(openedAt))}, or upgrade your plan. The limit is checked when the campaign goes out.
            </p>
            {composer.preview && <Meter label="Sent this month" used={composer.preview.usedThisMonth} limit={composer.preview.monthlyLimit} />}
            <div className="cluster">
              <Button variant="primary" icon={CalendarClock} onClick={() => askSchedule(true)}>
                Schedule after the reset
              </Button>
              <Button variant="accent" to={`/app/${slug}/settings?tab=billing`}>
                Upgrade plan
              </Button>
            </div>
          </div>
        </div>
      )
    }
    if (noAudience && selected) {
      return (
        <Alert tone="warning" icon={Users} title="No one to send to yet" live>
          {selected.value === 'all'
            ? 'Nobody has subscribed yet. Share a page to start collecting emails.'
            : `Nobody has subscribed through ${selected.title} yet. Choose another audience, or share a page that sells it to start collecting emails.`}
        </Alert>
      )
    }
    if (composer.previewStatus === 'error') {
      return (
        <Alert tone="warning" icon={CircleAlert} title="Couldn’t check your sends left">
          <Button variant="secondary" size="sm" onClick={composer.retryPreview}>
            Try again
          </Button>
        </Alert>
      )
    }
    if (composer.previewStatus === 'loading' || recipientCount === null) return <SkeletonBlock />
    return (
      <Alert tone="info" icon={Info} title={plural(recipientCount, 'recipient')}>
        {remaining === null
          ? `Your plan has unlimited sends. This campaign uses ${number(recipientCount)}.`
          : `You have ${number(left)} sends left this month. This campaign uses ${number(recipientCount)}.`}
      </Alert>
    )
  }

  const form = () => (
    <>
      <PageHeader
        eyebrow="Email marketing"
        title={
          <>
            New <em>campaign</em>
          </>
        }
        actions={
          <>
            <Button variant="ghost" to={`/app/${slug}/emails`}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              icon={CalendarClock}
              disabledReason={noAudience ? sendTip : undefined}
              onClick={() => askSchedule(overLimit)}
            >
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
          <Card title="Audience" subtitle="Only active subscribers receive it">
            {!audiences ? (
              composer.audiencesStatus === 'error' ? (
                <Alert tone="danger" icon={CircleAlert} title="Couldn’t load your audiences" />
              ) : (
                <SkeletonRows count={3} />
              )
            ) : (
              <div className="stack stack--sm" role="radiogroup" aria-label="Audience">
                {rows.map((row) => (
                  <label className="choice" key={row.value}>
                    <input
                      className="choice__input"
                      type="radio"
                      name="audience"
                      checked={row.value === composer.selection}
                      onChange={() => composer.setSelection(row.value)}
                    />
                    <span className="cluster cluster--between cluster--nowrap">
                      <span className="cluster cluster--nowrap">
                        <row.icon className="choice__icon" />
                        <span className="stack stack--xs">
                          <span className="choice__title">{row.title}</span>
                          <span className="text-xs text-muted">{row.meta}</span>
                        </span>
                      </span>
                      <Badge tone={row.count ? undefined : 'warning'}>{plural(row.count, 'recipient')}</Badge>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Card>
          <Card title="Message">
            <div className="form">
              <Field label="Start from template">
                {(control) => (
                  <Select {...control} value={composer.templateId} onChange={(event) => composer.requestTemplate(event.target.value)}>
                    <option value="">None</option>
                    {composer.templates.map((template) => (
                      <option key={template.publicId} value={template.publicId}>
                        {template.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Subject" error={attempted ? (composer.subjectError ?? undefined) : undefined}>
                {(control) => (
                  <Input
                    {...control}
                    maxLength={SUBJECT_MAX_LENGTH}
                    value={content.subject}
                    onChange={(event) => composer.setField('subject', event.target.value)}
                  />
                )}
              </Field>
              <Field label="Message" error={attempted ? (composer.bodyError ?? undefined) : undefined}>
                {(control) => (
                  <Textarea
                    {...control}
                    rows={7}
                    maxLength={BODY_MAX_LENGTH}
                    value={content.bodyText}
                    onChange={(event) => composer.setField('bodyText', event.target.value)}
                  />
                )}
              </Field>
              <div className="form-row">
                <Field label="Button text" optional error={attempted && !content.ctaLabel.trim() ? (composer.ctaError ?? undefined) : undefined}>
                  {(control) => (
                    <Input
                      {...control}
                      maxLength={CTA_LABEL_MAX_LENGTH}
                      value={content.ctaLabel}
                      onChange={(event) => composer.setField('ctaLabel', event.target.value)}
                    />
                  )}
                </Field>
                <Field label="Button URL" optional error={attempted && !content.ctaUrl.trim() ? (composer.ctaError ?? undefined) : undefined}>
                  {(control) => (
                    <Input
                      {...control}
                      type="url"
                      maxLength={CTA_URL_MAX_LENGTH}
                      placeholder="https://"
                      value={content.ctaUrl}
                      onChange={(event) => composer.setField('ctaUrl', event.target.value)}
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
            subject={content.subject}
            body={content.bodyText}
            button={content.ctaLabel.trim() ? { label: content.ctaLabel.trim() } : undefined}
            device={device}
          />
        </Card>
      </div>

      <SendConfirmModal
        open={confirmingSend}
        recipientCount={recipientCount ?? 0}
        subject={content.subject.trim()}
        audienceTitle={selected?.title ?? ''}
        from={supportEmail ? `${brandName} <${supportEmail}>` : null}
        sendsLeftAfter={remaining === null ? null : Math.max(0, left - (recipientCount ?? 0))}
        busy={composer.isSending}
        error={composer.sendError}
        onCancel={() => setConfirmingSend(false)}
        onConfirm={() => void sendNow()}
      />
      {schedule && (
        <ScheduleModal
          key={schedule.key}
          open
          afterReset={schedule.afterReset}
          subject={content.subject.trim()}
          recipientCount={recipientCount}
          busy={composer.isSending}
          error={composer.sendError}
          onClose={() => setSchedule(null)}
          onSchedule={(at) => void scheduleFor(at)}
        />
      )}
      <ConfirmDialog
        open={composer.hasPendingTemplate}
        title="Replace current content?"
        text={
          composer.pendingIsBlank
            ? 'This clears the subject, message and button you have written.'
            : `This replaces the subject, message and button you have written with the content of “${composer.pendingTemplate?.name ?? 'the template'}”.`
        }
        confirmLabel="Replace"
        cancelLabel="Keep mine"
        onCancel={composer.cancelTemplateReplace}
        onConfirm={composer.confirmTemplateReplace}
      />
    </>
  )

  return (
    <AppShell slug={slug} activeSection="emails">
      {creatorLoading ? (
        <SkeletonRows />
      ) : !creator ? (
        <EmptyState title="Workspace not found" text="This address doesn’t match your workspace." />
      ) : sent ? (
        <SendingPanel slug={slug} initial={sent} />
      ) : (
        form()
      )}
    </AppShell>
  )
}
