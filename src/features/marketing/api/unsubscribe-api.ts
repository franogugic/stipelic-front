import { apiRequest } from '../../../shared/api/http-client'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

export type UnsubscribePage = {
  creator: { name: string; brandColor: string | null; logoUrl: string | null; supportEmail: string | null }
  alreadyUnsubscribed: boolean
}

export const UNSUBSCRIBE_LINK_INVALID = 'unsubscribe_link_invalid'

/** What the page shows; no side effect. A bad token is a 404 with code `unsubscribe_link_invalid`. */
export async function getUnsubscribePage(token: string): Promise<UnsubscribePage> {
  const res = await apiRequest<ApiResponse<UnsubscribePage>>(`/api/public/unsubscribe/${encodeURIComponent(token)}/info`)
  return res.data
}

/** The "Unsubscribe" button. Idempotent. */
export async function confirmUnsubscribe(token: string): Promise<UnsubscribePage> {
  const res = await apiRequest<ApiResponse<UnsubscribePage>>(
    `/api/public/unsubscribe/${encodeURIComponent(token)}/confirm`,
    { method: 'POST' },
  )
  return res.data
}
