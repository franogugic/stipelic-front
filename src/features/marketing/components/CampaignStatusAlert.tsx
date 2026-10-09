import { Ban, CalendarClock, CircleAlert, Send } from 'lucide-react'
import { dateTime } from '../../../shared/lib/format'
import { Alert, Meter, campaignStatusKey } from '../../../shared/ui/ledger'
import type { CampaignDetail } from '../model/types'

/** The banner at the top of a campaign: delivery progress, the schedule, the failure reason or the cancellation. */
export function CampaignStatusAlert({ campaign, zone }: { campaign: CampaignDetail; zone: string }) {
  const key = campaignStatusKey(campaign)
  if (key === 'sending') {
    return (
      <Alert
        tone="info"
        icon={Send}
        live
        title={`Sending — ${campaign.sentCount} of ${campaign.recipientCount} delivered`}
        action={<Meter label="Progress" used={campaign.sentCount} limit={campaign.recipientCount} />}
      />
    )
  }
  if (key === 'scheduled' && campaign.scheduledAt) {
    return (
      <Alert tone="info" icon={CalendarClock} title={`Scheduled for ${dateTime(campaign.scheduledAt)} (your time, ${zone})`}>
        It goes to everyone in the audience at that moment — the count is worked out when it goes out.
      </Alert>
    )
  }
  if (key === 'failed') {
    return (
      <Alert tone="danger" icon={CircleAlert} live title="This campaign couldn’t be sent">
        {campaign.note ?? 'It could not be dispatched.'}
      </Alert>
    )
  }
  if (key === 'cancelled') {
    return (
      <div className="alert">
        <Ban />
        <div className="alert__body">
          <p className="alert__title">Cancelled on {dateTime(campaign.updatedAt)}</p>
          <p>
            {campaign.scheduledAt ? `It was scheduled for ${dateTime(campaign.scheduledAt)}. ` : ''}Nothing was sent.
          </p>
        </div>
      </div>
    )
  }
  return null
}

