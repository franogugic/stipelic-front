import { useState } from 'react'
import { Card, StatusBadge } from '../../../shared/ui/figma'
import type { CampaignListItem } from '../model/types'
import { formatDateTime } from '../model/format-date'
import { CampaignDetailPanel } from './CampaignDeliveryDetails'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

function CampaignItem({
  slug,
  campaign,
  audienceName,
  isExpanded,
  onToggle,
}: {
  slug: string
  campaign: CampaignListItem
  audienceName: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const hasDeliveryData = campaign.status === 'Queued'
  const isSending = hasDeliveryData && campaign.sentCount + campaign.failedCount < campaign.recipientCount
  const rate = campaign.sentCount > 0 ? Math.round((campaign.uniqueOpenCount / campaign.sentCount) * 100) : null

  let badge = null
  if (campaign.status === 'Scheduled') {
    badge = (
      <StatusBadge
        status="scheduled"
        label={`Scheduled · ${campaign.scheduledAt ? formatDateTime(campaign.scheduledAt) : '—'}`}
      />
    )
  } else if (campaign.status === 'Failed') {
    badge = <StatusBadge status="failed" label="Failed" />
  } else if (campaign.status === 'Cancelled') {
    badge = <StatusBadge status="cancelled" label="Cancelled" />
  } else if (isSending) {
    badge = <StatusBadge status="pending" label={`Sending ${campaign.sentCount}/${campaign.recipientCount}`} />
  }

  return (
    <div className="rounded-lg bg-white/[0.04] light:bg-secondary">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        className="p-3.5 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3 mb-0.5">
          <p className="text-xs font-medium text-foreground truncate">{campaign.subject}</p>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">
          {audienceName} · {dateLabel(campaign.createdAt)}
        </p>
        {hasDeliveryData && (
          <div className="flex gap-5">
            <div>
              <p className="text-[10px] text-muted-foreground">Sent</p>
              <p className="text-xs font-mono text-foreground mt-0.5">{campaign.sentCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Opens</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-chart-1)' }}>
                {campaign.uniqueOpenCount}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Rate</p>
              <p
                className="text-xs font-mono mt-0.5 font-bold"
                style={{ color: rate !== null && rate > 55 ? 'var(--color-chart-1)' : 'var(--color-chart-2)' }}
              >
                {rate === null ? '—' : `${rate}%`}
              </p>
            </div>
          </div>
        )}
      </div>
      {isExpanded && <CampaignDetailPanel slug={slug} campaign={campaign} />}
    </div>
  )
}

export function SentCampaignsCard({
  slug,
  campaigns,
  status,
  audienceName,
  className = '',
}: {
  slug: string
  campaigns: CampaignListItem[]
  status: LoadStatus
  audienceName: (campaign: CampaignListItem) => string
  className?: string
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <Card className={`p-5 ${className}`}>
      <p className="font-bold mb-4" style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.2rem' }}>
        Sent Campaigns
      </p>
      {status === 'loading' || (status === 'idle' && campaigns.length === 0) ? (
        <p className="text-sm text-muted-foreground">Loading campaigns…</p>
      ) : status === 'error' && campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">Could not load your campaigns. Please try again.</p>
      ) : campaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No campaigns sent yet</p>
      ) : (
        <div className="space-y-3 max-h-[560px] overflow-y-auto">
          {campaigns.map((campaign) => (
            <CampaignItem
              key={campaign.publicId}
              slug={slug}
              campaign={campaign}
              audienceName={audienceName(campaign)}
              isExpanded={expandedId === campaign.publicId}
              onToggle={() => setExpandedId(expandedId === campaign.publicId ? null : campaign.publicId)}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
