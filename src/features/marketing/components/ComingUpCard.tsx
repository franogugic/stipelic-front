import { CalendarClock, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dateShort, plural } from '../../../shared/lib/format'
import { Card, EmptyState, StatusBadge, campaignStatusKey } from '../../../shared/ui/ledger'
import type { CampaignListItem } from '../model/types'

/** "Coming up": campaigns going out now or scheduled, and how many templates are ready to reuse. */
export function ComingUpCard({
  upcoming,
  slug,
  templateCount,
  audienceName,
}: {
  upcoming: CampaignListItem[]
  slug: string
  /** Active templates; null while they load. */
  templateCount: number | null
  audienceName: (campaign: CampaignListItem) => string
}) {
  return (
    <Card title="Coming up" subtitle="Sending now and scheduled">
      <div className="fill-stack">
        {upcoming.length > 0 ? (
          <div className="list">
            {upcoming.map((campaign) => {
              const sending = campaignStatusKey(campaign) === 'sending'
              const Icon = sending ? Send : CalendarClock
              return (
                <Link className="list__row upcoming-row" to={`/app/${slug}/emails/campaigns/${campaign.publicId}`} key={campaign.publicId}>
                  <Icon />
                  <span className="list__grow person">
                    <span className="table__primary">{campaign.subject}</span>
                    <span className="table__secondary">
                      {audienceName(campaign)}
                      {campaign.recipientCount > 0 ? ` · ${plural(campaign.recipientCount, 'recipient')}` : ''}
                    </span>
                  </span>
                  <StatusBadge
                    kind="campaign"
                    value={campaignStatusKey(campaign)}
                    label={
                      sending
                        ? `${campaign.sentCount}/${campaign.recipientCount}`
                        : campaign.scheduledAt
                          ? dateShort(campaign.scheduledAt)
                          : undefined
                    }
                  />
                </Link>
              )
            })}
          </div>
        ) : (
          <EmptyState compact icon={CalendarClock} title="Nothing scheduled" text="Schedule a campaign and it waits here." />
        )}
        <p className="fill-stack__foot">
          <span>{templateCount === null ? 'Templates' : `${plural(templateCount, 'template')} ready to reuse`}</span>
          <Link className="link" to={`/app/${slug}/emails/templates`}>
            Templates
          </Link>
        </p>
      </div>
    </Card>
  )
}

