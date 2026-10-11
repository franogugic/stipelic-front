import { campaignStatusKey } from '../../../shared/ui/ledger'
import type { CampaignListItem } from './types'

export type CampaignGroup = 'sent' | 'upcoming' | 'stopped'

/** Sent: delivered; Upcoming: going out now or scheduled; Not sent: failed or cancelled. */
export function campaignGroup(campaign: CampaignListItem): CampaignGroup {
  const key = campaignStatusKey(campaign)
  if (key === 'sent') return 'sent'
  if (key === 'sending' || key === 'scheduled') return 'upcoming'
  return 'stopped'
}

/** Opened ÷ delivered, as a percentage. */
export const openRateOf = (campaign: CampaignListItem) =>
  campaign.sentCount > 0 ? (campaign.uniqueOpenCount / campaign.sentCount) * 100 : 0

/** The moment a campaign is placed on the timeline: sent, else scheduled, else created. */
export const campaignDateOf = (campaign: CampaignListItem) => campaign.queuedAt ?? campaign.scheduledAt ?? campaign.createdAt

export const CAMPAIGN_FILTERS: Array<[string, string]> = [
  ['all', 'All'],
  ['sent', 'Sent'],
  ['upcoming', 'Upcoming'],
  ['stopped', 'Not sent'],
]
