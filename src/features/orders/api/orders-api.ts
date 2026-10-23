import { downloadFile } from '../../../shared/api/download'
import { apiRequest } from '../../../shared/api/http-client'
import type { AnalyticsPeriod } from '../../analytics/model/types'
import type { HomeSummary, OrderPeriodSummary, OrdersPage, OrderSummary } from '../model/types'

type ApiResponse<T> = { statusCode: number; message: string; code: string; data: T }

export type OrderFilters = {
  /** Only orders counted in this period (the creator's timezone); the list is then ordered by the counted date. */
  period?: AnalyticsPeriod
  productId?: string
  landingPageId?: string
  status?: string
  /** Customer name or email. */
  search?: string
}

function filterParams(filters: OrderFilters) {
  const params = new URLSearchParams()
  if (filters.period) params.set('period', filters.period)
  if (filters.productId) params.set('productId', filters.productId)
  if (filters.landingPageId) params.set('landingPageId', filters.landingPageId)
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  return params
}

export async function listOrders(
  slug: string,
  options: OrderFilters & {
    /** The cursor: the last row's `countedAt` with a period, else its `createdAt`. */
    afterCountedAt?: string
    afterCreatedAt?: string
    afterId?: string
    limit?: number
  } = {},
): Promise<OrdersPage> {
  const params = filterParams(options)
  if (options.afterCountedAt) params.set('afterCountedAt', options.afterCountedAt)
  if (options.afterCreatedAt) params.set('afterCreatedAt', options.afterCreatedAt)
  if (options.afterId) params.set('afterId', options.afterId)
  if (options.limit) params.set('limit', String(options.limit))

  const query = params.toString()
  const res = await apiRequest<ApiResponse<OrdersPage>>(
    `/api/creators/${slug}/orders${query ? `?${query}` : ''}`,
  )
  return res.data
}

/** Saves the orders matching the filters as a CSV (the file name comes from the server). */
export function exportOrders(slug: string, filters: OrderFilters): Promise<void> {
  const query = filterParams(filters).toString()
  return downloadFile(`/api/creators/${slug}/orders/export${query ? `?${query}` : ''}`, `orders-${slug}.csv`)
}

export async function getOrderSummary(slug: string): Promise<OrderSummary> {
  const res = await apiRequest<ApiResponse<OrderSummary>>(`/api/creators/${slug}/orders/summary`)
  return res.data
}

/** The totals, the previous period and the chart buckets of one period (creator timezone), optionally for one product. */
export async function getOrderPeriodSummary(slug: string, period: AnalyticsPeriod, productId?: string | null): Promise<OrderPeriodSummary> {
  const params = new URLSearchParams({ period })
  if (productId) params.set('productId', productId)
  const res = await apiRequest<ApiResponse<OrderPeriodSummary>>(`/api/creators/${slug}/orders/summary?${params}`)
  return res.data
}

export async function getHomeSummary(slug: string): Promise<HomeSummary> {
  const res = await apiRequest<ApiResponse<HomeSummary>>(`/api/creators/${slug}/orders/home-summary`)
  return res.data
}
