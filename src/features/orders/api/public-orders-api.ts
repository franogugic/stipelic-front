import { apiRequest } from '../../../shared/api/http-client'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

export type OrderReceipt = {
  /** Display reference, without the "#". */
  orderNumber: string
  /** "Pending" until the payment webhook has arrived, then "Paid" (or "Refunded" / "Failed"). */
  status: string
  buyerFirstName: string | null
  /** Masked by the API, e.g. "a•••@gmail.com". Null while Pending (it arrives with the payment). */
  buyerEmail: string | null
  productName: string
  /** The product's file, for the download button; null when it has none. */
  fileName?: string | null
  fileSizeBytes?: number | null
  /** The personal link's token while the order is Paid (the receipt returns it for this page); null otherwise. */
  accessToken?: string | null
  amountCents: number
  currency: string
  paidAt: string | null
  creator: {
    name: string
    slug: string
    brandColor: string | null
    logoUrl: string | null
    supportEmail: string | null
  }
}

/** The buyer's receipt for a Stripe Checkout session (the `session_id` of the success URL). 404 for an unknown one. */
export async function getOrderReceipt(sessionId: string): Promise<OrderReceipt> {
  const res = await apiRequest<ApiResponse<OrderReceipt>>(
    `/api/public/orders/receipt?sessionId=${encodeURIComponent(sessionId)}`,
  )
  return res.data
}
