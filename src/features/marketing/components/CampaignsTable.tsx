import { Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { date, dateShort, number, percent } from '../../../shared/lib/format'
import {
  EmptyState,
  ErrorState,
  SkeletonRows,
  StatusBadge,
  TableFilterBar,
  campaignSendingLabel,
  campaignStatusKey,
} from '../../../shared/ui/ledger'
import { CAMPAIGN_FILTERS, campaignDateOf, campaignGroup, openRateOf } from '../model/campaign-groups'
import type { CampaignListItem } from '../model/types'

/** "Campaigns": the latest campaigns with a status filter and their delivery numbers. Each subject opens the campaign. */
export function CampaignsTable({
  campaigns,
  status,
  filter,
  onFilter,
  query,
  onQuery,
  audienceName,
  slug,
  newCampaignTo,
  onRetry,
}: {
  campaigns: CampaignListItem[]
  status: 'idle' | 'loading' | 'success' | 'error'
  filter: string
  onFilter: (key: string) => void
  query: string
  onQuery: (value: string) => void
  audienceName: (campaign: CampaignListItem) => string
  slug: string
  newCampaignTo: string
  onRetry: () => void
}) {
  const needle = query.trim().toLowerCase()
  const visible = campaigns
    .filter((campaign) => filter === 'all' || campaignGroup(campaign) === filter)
    .filter((campaign) => !needle || campaign.subject.toLowerCase().includes(needle))

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
          action={{ label: 'New campaign', icon: Send, variant: 'primary', to: newCampaignTo }}
        />
      )
    }
    return (
      <>
        <TableFilterBar
          noun="campaigns"
          statuses={CAMPAIGN_FILTERS}
          status={filter}
          count={(key) => campaigns.filter((campaign) => key === 'all' || campaignGroup(campaign) === key).length}
          onStatus={onFilter}
          query={query}
          onQuery={onQuery}
        />
        {visible.length > 0 && (
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
                  <th scope="col">Open rate</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((campaign) => {
                  const statusKey = campaignStatusKey(campaign)
                  const label =
                    statusKey === 'sending'
                      ? campaignSendingLabel(campaign)
                      : statusKey === 'scheduled' && campaign.scheduledAt
                        ? `Scheduled ${dateShort(campaign.scheduledAt)}`
                        : undefined
                  const rate = openRateOf(campaign)
                  return (
                    <tr key={campaign.publicId}>
                      <td className="is-lead">
                        <Link className="table__primary" to={`/app/${slug}/emails/campaigns/${campaign.publicId}`}>
                          {campaign.subject}
                        </Link>
                      </td>
                      <td data-label="Audience" className="text-secondary">
                        {audienceName(campaign)}
                      </td>
                      <td data-label="Date" className="num">
                        {date(campaignDateOf(campaign))}
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
                      <td data-label="Open rate">
                        {campaign.sentCount > 0 ? (
                          <span className="rate-cell">
                            <span className="rate-cell__bar" aria-hidden="true">
                              <span style={{ '--w': `${rate.toFixed(1)}%` } as React.CSSProperties} />
                            </span>
                            <span className="num">{percent(rate)}</span>
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {visible.length === 0 && <p className="filter-results text-sm text-muted">No campaigns match your search.</p>}
      </>
    )
  }

  return (
    <section className="card" aria-label="Campaigns">
      {body()}
    </section>
  )
}
