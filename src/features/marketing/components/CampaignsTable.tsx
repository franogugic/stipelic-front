import { Send } from 'lucide-react'
import { date, dateShort, number, percent } from '../../../shared/lib/format'
import { Card, EmptyState, ErrorState, SkeletonRows, StatusBadge, campaignSendingLabel, campaignStatusKey } from '../../../shared/ui/ledger'
import type { CampaignListItem } from '../model/types'

/** "Campaigns": the latest campaigns with their delivery numbers. Rows are plain text until there is a detail page. */
export function CampaignsTable({
  campaigns,
  status,
  audienceName,
  onNewCampaign,
  onRetry,
}: {
  campaigns: CampaignListItem[]
  status: 'idle' | 'loading' | 'success' | 'error'
  audienceName: (campaign: CampaignListItem) => string
  onNewCampaign: () => void
  onRetry: () => void
}) {
  const body = () => {
    if (status === 'idle' || status === 'loading') return <SkeletonRows count={4} />
    if (status === 'error') return <ErrorState compact onRetry={onRetry} />
    if (campaigns.length === 0) {
      return (
        <EmptyState
          compact
          icon={Send}
          title="No campaigns yet"
          text="Send your first campaign to the people who joined your pages."
          action={{ label: 'New campaign', icon: Send, variant: 'primary', onClick: onNewCampaign }}
        />
      )
    }
    return (
      <div className="table-wrap">
        <table className="table table--stack">
          <thead>
            <tr>
              <th scope="col">Subject</th>
              <th scope="col">Audience</th>
              <th scope="col">Date</th>
              <th scope="col">Status</th>
              <th scope="col" className="is-num">
                Sent
              </th>
              <th scope="col" className="is-num">
                Opens
              </th>
              <th scope="col" className="is-num">
                Open rate
              </th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => {
              const statusKey = campaignStatusKey(campaign)
              const label =
                statusKey === 'sending'
                  ? campaignSendingLabel(campaign)
                  : statusKey === 'scheduled' && campaign.scheduledAt
                    ? `Scheduled ${dateShort(campaign.scheduledAt)}`
                    : undefined
              return (
                <tr key={campaign.publicId}>
                  <td className="is-lead">
                    <span className="table__primary">{campaign.subject}</span>
                  </td>
                  <td data-label="Audience" className="text-secondary">
                    {audienceName(campaign)}
                  </td>
                  <td data-label="Date" className="num">
                    {date(campaign.queuedAt ?? campaign.scheduledAt ?? campaign.createdAt)}
                  </td>
                  <td data-label="Status">
                    <StatusBadge kind="campaign" value={statusKey} label={label} />
                  </td>
                  <td data-label="Sent" className="is-num">
                    {number(campaign.sentCount)}
                  </td>
                  <td data-label="Opens" className="is-num">
                    {number(campaign.uniqueOpenCount)}
                  </td>
                  <td data-label="Open rate" className="is-num">
                    {campaign.sentCount > 0 ? percent((campaign.uniqueOpenCount / campaign.sentCount) * 100) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <Card title="Campaigns" flush>
      {body()}
    </Card>
  )
}
