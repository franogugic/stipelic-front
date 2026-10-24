import { apiRequest } from '../../../shared/api/http-client'
import type { ConnectPayoutDetails } from '../model/types'

type ApiResponse<TData> = {
  statusCode: number
  message: string
  code: string
  data: TData
}

function unwrapApiResponse<TData>(response: ApiResponse<TData>) {
  return response.data
}

export function getConnectPayoutDetails(slug: string) {
  return apiRequest<ApiResponse<ConnectPayoutDetails>>(
    `/api/creators/${encodeURIComponent(slug)}/payouts/connect`,
  ).then(unwrapApiResponse)
}

/** Single-use, short-lived Stripe Express sign-in link; never cached, so fetch it on click. */
export function createConnectDashboardLink() {
  return apiRequest<ApiResponse<{ url: string }>>('/api/creators/current/payouts/connect/login-link', {
    method: 'POST',
  }).then(unwrapApiResponse)
}
