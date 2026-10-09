import type { CampaignDetail } from './types'

/** Done when everything was either delivered or failed — or the campaign left the Queued state altogether. */
export const isCampaignComplete = (campaign: Pick<CampaignDetail, 'status' | 'sentCount' | 'failedCount' | 'recipientCount'>) =>
  campaign.status !== 'Queued' || campaign.sentCount + campaign.failedCount >= campaign.recipientCount
