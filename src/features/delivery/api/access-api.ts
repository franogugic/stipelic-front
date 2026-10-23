import { apiRequest } from '../../../shared/api/http-client'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

/** What a personal download link opens (`GET /api/public/access/{token}`). */
export type AccessInfo = {
  productName: string
  fileName: string
  fileSizeBytes: number
  brand: { name: string; color: string | null; logoUrl: string | null; supportEmail?: string | null }
  /** The link came from a paid order, or from a lead-page sign-up. */
  source: 'order' | 'capture'
  /** Order links only. */
  orderNumber?: string | null
  paidAt?: string | null
}

const base = (token: string) => `/api/public/access/${encodeURIComponent(token)}`

/** The file behind a personal link. 404 `ACCESS_INVALID`, 410 `ACCESS_REVOKED` (a refunded order), 429 rate limited. */
export function getAccess(token: string) {
  return apiRequest<ApiResponse<AccessInfo>>(base(token)).then((response) => response.data)
}

/** A fresh 10-minute address of the file (it downloads as an attachment). Counts the download. */
export function requestDownloadUrl(token: string) {
  return apiRequest<ApiResponse<{ url: string }>>(`${base(token)}/download`, { method: 'POST' }).then((response) => response.data.url)
}

/** The page a personal link opens, as the emails link to it. */
export const downloadPageUrl = (token: string) => `${window.location.origin}/d/${token}`
