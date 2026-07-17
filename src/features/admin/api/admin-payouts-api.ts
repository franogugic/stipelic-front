import { apiRequest } from '../../../shared/api/http-client'
import type {
  AdminPayout,
  CreatePayoutRequest,
  CreatorBalanceSummary,
  MarkPayoutFailedRequest,
  MarkPayoutPaidRequest,
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

export function getPayoutBalances(minCents?: number, limit?: number) {
  const params = new URLSearchParams()
  if (minCents !== undefined) params.set('minCents', String(minCents))
  if (limit !== undefined) params.set('limit', String(limit))
  const query = params.toString()

  return apiRequest<ApiResponse<CreatorBalanceSummary[]>>(
    `/api/admin/payouts/balances${query ? `?${query}` : ''}`,
  ).then(unwrapApiResponse)
}

export function createPayout(request: CreatePayoutRequest) {
  return apiRequest<ApiResponse<AdminPayout>>('/api/admin/payouts', {
    method: 'POST',
    body: {
      creatorPublicId: request.creatorPublicId,
      amountCents: request.amountCents,
      currency: request.currency,
      note: request.note?.trim() || null,
    },
  }).then(unwrapApiResponse)
}

export function markPayoutPaid(publicId: string, request: MarkPayoutPaidRequest) {
  return apiRequest<ApiResponse<AdminPayout>>(
    `/api/admin/payouts/${encodeURIComponent(publicId)}/mark-paid`,
    {
      method: 'POST',
      body: { bankReference: request.bankReference.trim() },
    },
  ).then(unwrapApiResponse)
}

export function markPayoutFailed(publicId: string, request: MarkPayoutFailedRequest) {
  return apiRequest<ApiResponse<AdminPayout>>(
    `/api/admin/payouts/${encodeURIComponent(publicId)}/mark-failed`,
    {
      method: 'POST',
      body: { note: request.note?.trim() || null },
    },
  ).then(unwrapApiResponse)
}
