import { ArrowRight, CornerUpLeft } from 'lucide-react'
import { date } from '../../../shared/lib/format'
import { Button } from '../../../shared/ui/ledger'
import { RESEND_LIMIT } from '../model/types'
import type { CampaignDetail } from '../model/types'

/** On a resend's own page: what it is, and the way back to the original and all its resends. */
export function ResendOrigin({ slug, campaign }: { slug: string; campaign: CampaignDetail }) {
  const round = campaign.resendRound ?? 1
  return (
    <div className="alert resend-origin">
      <CornerUpLeft />
      <div className="alert__body">
        <p className="alert__title">
          Resend {round} of {RESEND_LIMIT} · “{campaign.source?.subject ?? '—'}”
        </p>
        <p>
          {campaign.queuedAt
            ? `Sent to the people who hadn’t opened the original${round > 1 ? ' or an earlier resend' : ''} by ${date(campaign.queuedAt)}.`
            : campaign.status === 'Scheduled'
              ? `Goes to the people who haven’t opened the original${round > 1 ? ' or an earlier resend' : ''} by then.`
              : `Meant for the people who hadn’t opened the original${round > 1 ? ' or an earlier resend' : ''}.`}
        </p>
      </div>
      {campaign.sourceCampaignPublicId && (
        <Button variant="secondary" icon={ArrowRight} to={`/app/${slug}/emails/campaigns/${campaign.sourceCampaignPublicId}`}>
          View original and all resends
        </Button>
      )}
    </div>
  )
}
