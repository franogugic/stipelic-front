import { ArrowRight, Info, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { number, plural, time } from '../../../shared/lib/format'
import { Button, Meter, PageHeader } from '../../../shared/ui/ledger'
import { getCampaign } from '../api/campaigns-api'
import { isBuyersAudience } from '../model/audience'
import { isCampaignComplete } from '../model/campaign-progress'
import type { CampaignDetail } from '../model/types'

const POLL_INTERVAL_MS = 3000

/** What follows "Send now": the campaign's delivery, polled every 3 s until it is complete. */
export function SendingPanel({
  slug,
  initial,
  resend,
}: {
  slug: string
  initial: CampaignDetail
  /** A resend to non-openers: which one it is, and the original it hangs off. */
  resend?: { round: number; limit: number; originalPublicId: string }
}) {
  const [campaign, setCampaign] = useState(initial)
  const complete = isCampaignComplete(campaign)
  const id = initial.publicId

  useEffect(() => {
    if (isCampaignComplete(initial)) return
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      try {
        const latest = await getCampaign(slug, id)
        if (!active) return
        setCampaign(latest)
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
  }, [slug, id, initial])

  const overview = `/app/${slug}/emails`
  const detail = resend ? `/app/${slug}/emails/campaigns/${resend.originalPublicId}` : `/app/${slug}/emails/campaigns/${id}`
  const who = resend ? 'who didn’t open' : ''
  const noun = isBuyersAudience(campaign.audienceType) ? 'buyer' : 'subscriber'
  const subject = `“${campaign.subject}”`
  return (
    <>
      <PageHeader
        eyebrow={resend ? `Email marketing · Resend ${resend.round} of ${resend.limit}` : 'Email marketing'}
        title={
          <>
            {complete ? `Your ${resend ? 'resend' : 'campaign'} was ` : 'Sending your '}
            <em>{complete ? 'sent' : resend ? 'resend' : 'campaign'}</em>
          </>
        }
      />
      <section className="card sending-panel" aria-labelledby="sending-title">
        <div className="card__body stack stack--lg">
          <span className="sending-panel__icon">
            <Send />
          </span>
          <div className="stack stack--sm">
            <h2 className="state__title" id="sending-title">
              {complete
                ? `Sent to ${resend ? plural(campaign.sentCount, 'person', 'people') : plural(campaign.sentCount, noun)}${who ? ` ${who}` : ''}`
                : `On its way to ${resend ? plural(campaign.recipientCount, 'person', 'people') : plural(campaign.recipientCount, noun)}${who ? ` ${who}` : ''}`}
            </h2>
            <p className="text-secondary">
              {complete
                ? `${subject}${campaign.failedCount > 0 ? ` · ${number(campaign.failedCount)} couldn’t be delivered.` : ' · everyone got it.'}`
                : resend
                  ? `${subject} · started at ${time(campaign.queuedAt ?? campaign.createdAt)}. It shows up under the original campaign as resend ${resend.round}.`
                  : `${subject} · started at ${time(campaign.queuedAt ?? campaign.createdAt)}. Large lists go out in batches, so this can take a few minutes.`}
            </p>
          </div>
          <Meter label="Delivered so far" used={campaign.sentCount} limit={campaign.recipientCount} />
          {!complete && (
            <p className="text-sm text-muted">
              <Info className="inline-icon" /> You can leave this page — sending continues in the background.
            </p>
          )}
          <div className="cluster">
            <Button variant="primary" icon={ArrowRight} to={detail}>
              {resend ? 'Back to the campaign' : 'View campaign'}
            </Button>
            <Button variant="ghost" to={overview}>
              Back to email marketing
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
