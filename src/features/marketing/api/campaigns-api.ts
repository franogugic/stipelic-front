import { apiRequest } from '../../../shared/api/http-client'
import type {
  AudiencePreview,
  AudienceRecipientsPage,
  CampaignAudiences,
  CampaignAudienceType,
  CampaignDetail,
  CampaignListItem,
  FailedRecipient,
  OpenRateTrend,
  ResendFailedResult,
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

// The All audience has no target, so the parameter is left out for it.
function audienceParams(audienceType: CampaignAudienceType, targetPublicId: string | null) {
  const params = new URLSearchParams({ audienceType })
  if (targetPublicId) params.set('targetPublicId', targetPublicId)
  return params
}

export function getCampaignAudiences(slug: string) {
  return apiRequest<ApiResponse<CampaignAudiences>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns/audiences`,
  ).then(unwrapApiResponse)
}

export function getOpenRateTrend(slug: string, months = 6) {
  return apiRequest<ApiResponse<OpenRateTrend>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns/open-rate-trend?months=${months}`,
  ).then(unwrapApiResponse)
}

export function getAudiencePreview(
  slug: string,
  audienceType: CampaignAudienceType,
  targetPublicId: string | null,
) {
  const params = audienceParams(audienceType, targetPublicId)
  return apiRequest<ApiResponse<AudiencePreview>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns/audience-preview?${params.toString()}`,
  ).then(unwrapApiResponse)
}

export function getAudienceRecipients(
  slug: string,
  audienceType: CampaignAudienceType,
  targetPublicId: string | null,
  options: { afterEmail?: string; limit?: number } = {},
) {
  const params = audienceParams(audienceType, targetPublicId)
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

export function resendFailedRecipients(slug: string, campaignPublicId: string) {
  return apiRequest<ApiResponse<ResendFailedResult>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns/${encodeURIComponent(campaignPublicId)}/resend-failed`,
    { method: 'POST' },
  ).then(unwrapApiResponse)
}

export function cancelScheduledCampaign(slug: string, campaignPublicId: string) {
  return apiRequest<ApiResponse<CampaignDetail>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns/${encodeURIComponent(campaignPublicId)}/schedule`,
    { method: 'DELETE' },
  ).then(unwrapApiResponse)
}
