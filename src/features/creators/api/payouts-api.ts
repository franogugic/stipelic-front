import { apiRequest } from '../../../shared/api/http-client'
import type {
  ConnectPayoutDetails,
  Payout,
  PayoutProfile,
  PayoutSummary,
  UpdatePayoutProfileRequest,
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

export function getPayoutSummary(slug: string) {
  return apiRequest<ApiResponse<PayoutSummary | null>>(
    `/api/creators/${encodeURIComponent(slug)}/payouts/summary`,
  ).then(unwrapApiResponse)
}

export function getConnectPayoutDetails(slug: string) {
  return apiRequest<ApiResponse<ConnectPayoutDetails>>(
    `/api/creators/${encodeURIComponent(slug)}/payouts/connect`,
  ).then(unwrapApiResponse)
}

export function listPayouts(slug: string) {
  return apiRequest<ApiResponse<Payout[]>>(
    `/api/creators/${encodeURIComponent(slug)}/payouts`,
  ).then(unwrapApiResponse)
}

export function getPayoutProfile(slug: string) {
  return apiRequest<ApiResponse<PayoutProfile | null>>(
    `/api/creators/${encodeURIComponent(slug)}/payout-profile`,
  ).then(unwrapApiResponse)
}

export function updatePayoutProfile(slug: string, request: UpdatePayoutProfileRequest) {
  return apiRequest<ApiResponse<PayoutProfile>>(
    `/api/creators/${encodeURIComponent(slug)}/payout-profile`,
    {
      method: 'PUT',
      body: {
        accountHolderName: request.accountHolderName.trim(),
        iban: request.iban.trim(),
        bankCountryCode: request.bankCountryCode.trim(),
      },
    },
  ).then(unwrapApiResponse)
}

export function requestPayout(slug: string, amountCents: number | null) {
  return apiRequest<ApiResponse<Payout>>(
    `/api/creators/${encodeURIComponent(slug)}/payouts/request`,
    {
      method: 'POST',
      body: { amountCents },
    },
  ).then(unwrapApiResponse)
}

export function cancelPayoutRequest(slug: string, payoutPublicId: string) {
  return apiRequest<ApiResponse<Payout>>(
    `/api/creators/${encodeURIComponent(slug)}/payouts/${encodeURIComponent(payoutPublicId)}`,
    { method: 'DELETE' },
  ).then(unwrapApiResponse)
}

/** Single-use, short-lived Stripe Express sign-in link; never cached, so fetch it on click. */
export function createConnectDashboardLink() {
  return apiRequest<ApiResponse<{ url: string }>>('/api/creators/current/payouts/connect/login-link', {
    method: 'POST',
  }).then(unwrapApiResponse)
}
