import { apiRequest } from '../../../shared/api/http-client'
import type { HomeSummary, OrdersPage, OrderSummary } from '../model/types'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

export async function listOrders(
  slug: string,
  options: {
    productId?: string
    status?: string
    afterCreatedAt?: string
    afterId?: string
    limit?: number
  } = {},
): Promise<OrdersPage> {
  const params = new URLSearchParams()
  if (options.productId) params.set('productId', options.productId)
  if (options.status) params.set('status', options.status)
  if (options.afterCreatedAt) params.set('afterCreatedAt', options.afterCreatedAt)
  if (options.afterId) params.set('afterId', options.afterId)
  if (options.limit) params.set('limit', String(options.limit))

  const query = params.toString()
  const res = await apiRequest<ApiResponse<OrdersPage>>(
    `/api/creators/${slug}/orders${query ? `?${query}` : ''}`,
  )
  return res.data
}

export async function getOrderSummary(slug: string): Promise<OrderSummary> {
  const res = await apiRequest<ApiResponse<OrderSummary>>(`/api/creators/${slug}/orders/summary`)
  return res.data
}

export async function getHomeSummary(slug: string): Promise<HomeSummary> {
  const res = await apiRequest<ApiResponse<HomeSummary>>(`/api/creators/${slug}/orders/home-summary`)
  return res.data
}
