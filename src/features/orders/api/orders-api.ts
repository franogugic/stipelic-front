import { apiRequest } from '../../../shared/api/http-client'
import type { Order, OrderSummary } from '../model/types'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

export async function listOrders(slug: string): Promise<Order[]> {
  const res = await apiRequest<ApiResponse<Order[]>>(`/api/creators/${slug}/orders`)
  return res.data
}

export async function getOrderSummary(slug: string): Promise<OrderSummary> {
  const res = await apiRequest<ApiResponse<OrderSummary>>(`/api/creators/${slug}/orders/summary`)
  return res.data
}
