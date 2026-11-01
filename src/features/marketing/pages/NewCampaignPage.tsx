import { ArrowUpRight, CalendarClock, CircleAlert, Info, Send, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { date, dateTime, number, plural } from '../../../shared/lib/format'
import { useKeyedLoad } from '../../../shared/lib/use-keyed-load'
import { AppShell } from '../../../shared/ui/AppShell'
import { EmailPreview } from '../../../shared/ui/EmailPreview'
import {
  Alert,
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
import { listLandingPages } from '../../landing-pages/api/landing-pages-api'
import type { LandingPage } from '../../landing-pages/model/types'
import { listProducts } from '../../products/api/products-api'
import { SendConfirmModal } from '../components/SendConfirmModal'
import { ResendCampaignPage } from './ResendCampaignPage'
import { ScheduleModal } from '../components/ScheduleModal'
import { SendingPanel } from '../components/SendingPanel'
import { audienceLabel, footerReasonOf, isBuyersAudience, selectionFromUrl, urlFromSelection } from '../model/audience'
import { nextReset } from '../model/schedule'
import { BODY_MAX_LENGTH, CTA_LABEL_MAX_LENGTH, CTA_URL_MAX_LENGTH, SUBJECT_MAX_LENGTH } from '../model/mail-content-rules'
import { useFeatures } from '../../../shared/model/features-store'
import { useCampaignComposer } from '../model/use-campaign-composer'
import type { CampaignAudienceType, CampaignDetail } from '../model/types'

type AudienceRow = { value: string; type: CampaignAudienceType; name: string; title: string; meta: string; count: number }
type AudienceGroup = { id: string; title?: string; note?: string; rows: AudienceRow[] }

const BUYERS_NOTE = 'Paid orders only — pending, failed and refunded ones don’t count. Anyone who unsubscribed is always left out.'

const PAGE_STATUS_META: Record<string, string> = { Published: 'Sales page', Draft: 'Sales page · draft', Archived: 'Sales page · archived' }

/** The wizard's audiences in groups — All, Sign-ups, Products, Buyers — each with its live count. */
function audienceGroups(
  audiences: NonNullable<ReturnType<typeof useCampaignComposer>['audiences']>,
  pages: LandingPage[],
  products: Map<string, string>,
  productPrices: Map<string, number>,
): AudienceGroup[] {
  const pageOf = new Map(pages.map((page) => [page.publicId, page]))
  return ([
    {
      id: 'all',
      rows: [{ value: 'all', type: 'All' as const, name: '', title: 'All subscribers', meta: 'Everyone who is subscribed', count: audiences.all.recipientCount }],
    },
    {
      id: 'signups',
      title: 'Sign-ups',
      // Lead pages collect sign-ups; any other page only appears once someone has subscribed through it.
      rows: audiences.landingPages
        .filter((page) => pageOf.get(page.publicId)?.type === 'LeadGen' || page.recipientCount > 0)
        .map((page) => {
        const full = pageOf.get(page.publicId)
        const gives = full?.productPublicId ? products.get(full.productPublicId) : undefined
        return {
          value: `LandingPage:${page.publicId}`,
          type: 'LandingPage' as const,
          name: page.title,
          title: `Sign-ups from ${page.title}`,
          meta: gives ? `Got ${gives} for their email` : 'Newsletter sign-ups',
          count: page.recipientCount,
        }
      }),
    },
    {
      id: 'products',
      title: 'Products',
      // Products that sell; a free one appears through its sign-up page above, unless it already has subscribers.
      rows: audiences.products
        .filter((product) => productPrices.get(product.publicId) !== 0 || product.recipientCount > 0)
        .map((product) => ({
        value: `Product:${product.publicId}`,
        type: 'Product' as const,
        name: product.name,
        title: product.name,
        meta: 'Subscribed on its pages',
        count: product.recipientCount,
      })),
    },
    {
      id: 'buyers',
      title: 'Buyers',
      note: BUYERS_NOTE,
      rows: audiences.landingPageBuyers.map((page) => ({
        value: `LandingPageBuyers:${page.publicId}`,
        type: 'LandingPageBuyers' as const,
        name: page.title,
        title: `Buyers from ${page.title}`,
        meta: PAGE_STATUS_META[pageOf.get(page.publicId)?.status ?? 'Published'] ?? 'Sales page',
        count: page.recipientCount,
      })),
    },
  ] satisfies AudienceGroup[]).filter((group) => group.rows.length > 0)
}

/** New campaign: pick an audience, write the message, then send it now or schedule it. With `?mode=resend&of=<id>`: the
 * resend wizard for that sent campaign. */
export function NewCampaignPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const resendOf = searchParams.get('mode') === 'resend' ? searchParams.get('of') : null
  if (resendOf) return <ResendCampaignPage slug={slug} originalPublicId={resendOf} />
  return <NewCampaignForm />
}

function NewCampaignForm() {
  const { paymentsOn } = useFeatures()
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

  const [searchParams, setSearchParams] = useSearchParams()
  const composer = useCampaignComposer({
    slug,
    initialTemplateId: searchParams.get('template'),
    requestedSelection: selectionFromUrl(searchParams.get('audience')),
  })
  const pagesLoad = useKeyedLoad(slug ? `pages|${slug}` : null, () => listLandingPages(slug, true))
  const productsLoad = useKeyedLoad(slug ? `products|${slug}` : null, () => listProducts(slug, true))
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
  const productNames = new Map(productsLoad.load.status === 'success' ? productsLoad.load.data.map((product) => [product.publicId, product.name]) : [])
  const productPrices = new Map(productsLoad.load.status === 'success' ? productsLoad.load.data.map((product) => [product.publicId, product.priceCents]) : [])
  const groups = audiences
    ? audienceGroups(audiences, pagesLoad.load.status === 'success' ? pagesLoad.load.data : [], productNames, productPrices)
    : []
  const rows = groups.flatMap((group) => group.rows)
  const selected = rows.find((row) => row.value === composer.selection) ?? null
  const buyers = isBuyersAudience(composer.audienceType)
  const noun = buyers ? 'buyer' : 'subscriber'
  const everyAudienceEmpty = audiences !== null && rows.every((row) => row.count === 0)
  const selectedLabel = selected ? audienceLabel(selected.type, selected.name) : ''
  const pick = (value: string) => {
    composer.setSelection(value)
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        const key = urlFromSelection(value)
        if (key) next.set('audience', key)
        else next.delete('audience')
        return next
      },
      { replace: true },
    )
  }
  const noAudience = recipientCount === 0
  const left = remaining ?? 0
  const sendTip = overLimit
    ? `Only ${number(left)} sends left this month — schedule it for after the reset`
    : noAudience
      ? 'Nobody to send to yet'
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
      message: `It goes out on ${dateTime(at)}${count === null ? '' : ` to ${plural(count, noun)}`}.`,
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
              reset on {date(nextReset(openedAt))}{paymentsOn ? ', or upgrade your plan' : ''}. The limit is checked when the campaign goes out.
            </p>
            {composer.preview && <Meter label="Sent this month" used={composer.preview.usedThisMonth} limit={composer.preview.monthlyLimit} />}
            <div className="cluster">
              <Button variant="primary" icon={CalendarClock} onClick={() => askSchedule(true)}>
                Schedule after the reset
              </Button>
              {paymentsOn && (
                <Button variant="accent" icon={ArrowUpRight} to={`/app/${slug}/settings?tab=billing`}>
                  Upgrade plan
                </Button>
              )}
            </div>
          </div>
        </div>
      )
    }
    if (noAudience && everyAudienceEmpty) {
      return (
        <div className="alert alert--warning" role="alert">
          <Users />
          <div className="alert__body">
            <p className="alert__title">No one to send to yet</p>
            <p>
              Nobody has subscribed or bought anything yet. Share a landing page to collect your first emails and sales — they show up here as
              audiences.
            </p>
            <div className="cluster">
              <Button variant="secondary" icon={ArrowUpRight} to={`/app/${slug}/landing-pages`}>
                Your landing pages
              </Button>
            </div>
          </div>
        </div>
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
      <Alert tone="info" icon={Info} title={`${plural(recipientCount, 'recipient')} · ${selectedLabel}`}>
        {buyers && 'Buyers who didn’t tick “keep me posted” at checkout get it too; the footer tells them why. '}
        {remaining === null
          ? `Your plan has unlimited sends. This campaign uses ${number(recipientCount)}.`
          : `You have ${number(left)} sends left this month — this campaign uses ${number(recipientCount)}.`}
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
          <Card title="Audience" subtitle="People who unsubscribed never get it">
            {!audiences ? (
              composer.audiencesStatus === 'error' ? (
                <Alert tone="danger" icon={CircleAlert} title="Couldn’t load your audiences" />
              ) : (
                <SkeletonRows count={3} />
              )
            ) : (
              <div className="option-list" role="radiogroup" aria-label="Audience">
                {groups.map((group) => (
                  <div
                    className="option-list__group"
                    key={group.id}
                    {...(group.title ? { role: 'group', 'aria-labelledby': `aud-${group.id}` } : {})}
                  >
                    {group.title && (
                      <p className="option-list__heading" id={`aud-${group.id}`}>
                        {group.title}
                      </p>
                    )}
                    {group.note && (
                      <p className="option-list__note">
                        <Info />
                        <span>{group.note}</span>
                      </p>
                    )}
                    {group.rows.map((row) => (
                      <label className={`option-row${row.count ? '' : ' is-empty'}`} key={row.value}>
                        <input
                          className="option-row__input"
                          type="radio"
                          name="audience"
                          checked={row.value === composer.selection}
                          disabled={row.count === 0}
                          onChange={() => pick(row.value)}
                        />
                        <span className="option-row__radio" aria-hidden="true" />
                        <span className="option-row__text">
                          <span className="option-row__title">{row.title}</span>
                          <span className="option-row__meta">
                            {row.count > 0
                              ? row.meta
                              : row.type === 'LandingPageBuyers'
                                ? 'No buyers yet — you can pick it after the first sale'
                                : 'Nobody yet'}
                          </span>
                        </span>
                        <span className={`option-row__count${row.count ? '' : ' is-zero'}`}>
                          {row.count ? plural(row.count, row.type === 'LandingPageBuyers' ? 'buyer' : 'subscriber') : '0'}
                        </span>
                      </label>
                    ))}
                  </div>
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
                <Field label="Button text" error={attempted && !content.ctaLabel.trim() ? (composer.ctaError ?? undefined) : undefined}>
                  {(control) => (
                    <Input
                      {...control}
                      maxLength={CTA_LABEL_MAX_LENGTH}
                      value={content.ctaLabel}
                      onChange={(event) => composer.setField('ctaLabel', event.target.value)}
                    />
                  )}
                </Field>
                <Field label="Button URL" error={attempted && !content.ctaUrl.trim() ? (composer.ctaError ?? undefined) : undefined}>
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
            reason={footerReasonOf(composer.audienceType)}
          />
        </Card>
      </div>

      <SendConfirmModal
        open={confirmingSend}
        recipientCount={recipientCount ?? 0}
        subject={content.subject.trim()}
        audienceTitle={selectedLabel}
        noun={noun}
        estimate={composer.preview}
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
          noun={noun}
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
