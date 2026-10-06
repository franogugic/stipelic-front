import { ArrowRight, Info, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { number, plural, time } from '../../../shared/lib/format'
import { Button, Meter, PageHeader } from '../../../shared/ui/ledger'
import { getCampaign } from '../api/campaigns-api'
import type { CampaignDetail } from '../model/types'

const POLL_INTERVAL_MS = 3000

/** Done when everything was either delivered or failed — or the campaign left the Queued state altogether. */
const isComplete = (campaign: CampaignDetail) =>
  campaign.status !== 'Queued' || campaign.sentCount + campaign.failedCount >= campaign.recipientCount

/** What follows "Send now": the campaign's delivery, polled every 3 s until it is complete. */
export function SendingPanel({ slug, initial }: { slug: string; initial: CampaignDetail }) {
  const [campaign, setCampaign] = useState(initial)
  const complete = isComplete(campaign)
  const id = initial.publicId

  useEffect(() => {
    if (isComplete(initial)) return
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      try {
        const latest = await getCampaign(slug, id)
        if (!active) return
        setCampaign(latest)
        if (isComplete(latest)) return
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
  const subject = `“${campaign.subject}”`
  return (
    <>
      <PageHeader
        eyebrow="Email marketing"
        title={
          <>
            {complete ? 'Your campaign was ' : 'Sending your '}
            <em>{complete ? 'sent' : 'campaign'}</em>
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
                ? `Sent to ${plural(campaign.sentCount, 'subscriber')}`
                : `On its way to ${plural(campaign.recipientCount, 'subscriber')}`}
            </h2>
            <p className="text-secondary">
              {complete
                ? `${subject}${campaign.failedCount > 0 ? ` · ${number(campaign.failedCount)} couldn’t be delivered.` : ' · everyone got it.'}`
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
            <Button variant="primary" icon={ArrowRight} to={overview}>
              View campaign
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
