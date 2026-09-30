import { apiRequest } from '../../../shared/api/http-client'
import type {
  CampaignAudiences,
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

export function listCampaigns(slug: string) {
  return apiRequest<ApiResponse<CampaignListItem[]>>(
    `/api/creators/${encodeURIComponent(slug)}/campaigns`,
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
