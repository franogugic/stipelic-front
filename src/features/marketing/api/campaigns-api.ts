import { apiRequest } from '../../../shared/api/http-client'
import type {
  AudiencePreview,
  AudienceRecipientsPage,
  CampaignAudienceType,
  CampaignDetail,
  CampaignListItem,
  FailedRecipient,
  SendCampaignRequest,
} from '../model/types'

type ApiResponse<TData> = {
  statusCode: number
  message: string
  code: string
  data: TData
}

function unwrapApiResponse<TData>(response: ApiResponse<TData>) {
  return response.data
}

export function getAudiencePreview(
  slug: string,
  audienceType: CampaignAudienceType,
  targetPublicId: string,
) {
  const params = new URLSearchParams({ audienceType, targetPublicId })
  return apiRequest<ApiResponse<AudiencePreview>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns/audience-preview?${params.toString()}`,
  ).then(unwrapApiResponse)
}

export function getAudienceRecipients(
  slug: string,
  audienceType: CampaignAudienceType,
  targetPublicId: string,
  options: { afterEmail?: string; limit?: number } = {},
) {
  const params = new URLSearchParams({ audienceType, targetPublicId })
  if (options.afterEmail) params.set('afterEmail', options.afterEmail)
  if (options.limit) params.set('limit', String(options.limit))

  return apiRequest<ApiResponse<AudienceRecipientsPage>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns/audience-preview/recipients?${params.toString()}`,
  ).then(unwrapApiResponse)
}

export function listCampaigns(slug: string) {
  return apiRequest<ApiResponse<CampaignListItem[]>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns`,
  ).then(unwrapApiResponse)
}

export function getCampaign(slug: string, campaignPublicId: string) {
  return apiRequest<ApiResponse<CampaignDetail>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns/${encodeURIComponent(campaignPublicId)}`,
  ).then(unwrapApiResponse)
}

export function getFailedRecipients(slug: string, campaignPublicId: string) {
  return apiRequest<ApiResponse<FailedRecipient[]>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns/${encodeURIComponent(campaignPublicId)}/failed-recipients`,
  ).then(unwrapApiResponse)
}

export function sendCampaign(slug: string, request: SendCampaignRequest) {
  return apiRequest<ApiResponse<CampaignDetail>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns/send`,
    { method: 'POST', body: request },
  ).then(unwrapApiResponse)
}
